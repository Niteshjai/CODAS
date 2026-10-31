import { Pool } from 'pg'
import { encryptPII as encrypt, decryptPII as decrypt } from '../utils/encryption'
import { auditLogger } from './auditLogger'
import { planEnforcer } from '../plans/planEnforcer'
import axios from 'axios'

// India Succession Act 1925 requirements:
// - Must be in writing
// - Signed by testator
// - Attested by 2 witnesses (not beneficiaries)
// - No stamp duty required for movable property wills

const WILL_DISCLAIMER = `
IMPORTANT NOTICE: This document is an asset allocation record
created using Codas and is NOT a substitute for a formally
drafted legal will. It is intended to assist you in organizing
your assets and communicating your wishes. For a legally valid
will under the Indian Succession Act 1925, please consult a
qualified lawyer. Codas Pvt. Ltd. does not provide legal
advice and this document creates no legal obligations.
`.trim()

/** Expected, user-correctable failures; routes map them to 4xx with this message. */
export class WillError extends Error {
  constructor(message: string, public readonly statusCode: 400 | 404 = 400) {
    super(message)
    this.name = 'WillError'
  }
}

export interface WillDetails {
  testatorName:     string
  testatorDob:      string   // YYYY-MM-DD
  testatorAddress:  string
  testatorPan?:     string
  executorName:     string
  executorRelation: string
  executorMobile:   string
  altExecutorName?: string
}

// willId comes from the URL: every write must confirm the caller owns the will
async function assertWillOwner(pool: Pool, willId: string, userId: string): Promise<void> {
  const owned = await pool.query(
    'SELECT 1 FROM wills WHERE id = $1 AND user_id = $2 AND status <> $3',
    [willId, userId, 'superseded']
  )
  if (!owned.rows.length) throw new WillError('Will not found', 404)
}

// Any change after a PDF was generated makes that PDF stale
async function markDraft(pool: Pool, willId: string): Promise<void> {
  await pool.query(
    `UPDATE wills SET status = 'draft', updated_at = NOW() WHERE id = $1 AND status = 'completed'`,
    [willId]
  )
}

function validateDetails(data: WillDetails): void {
  const dob = new Date(`${data.testatorDob}T00:00:00Z`)
  if (Number.isNaN(dob.getTime())) throw new WillError('Enter a valid date of birth.')
  const adultCutoff = new Date()
  adultCutoff.setUTCFullYear(adultCutoff.getUTCFullYear() - 18)
  if (dob > adultCutoff) throw new WillError('You must be at least 18 years old to make a will.')
  if (dob.getUTCFullYear() < 1900) throw new WillError('Enter a valid date of birth.')
  if (data.executorName.trim().toLowerCase() === data.testatorName.trim().toLowerCase()) {
    throw new WillError('Your executor must be someone other than yourself.')
  }
}

function formatDob(iso: string): string {
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${d}/${m}/${y}` : iso
}

const optionalEnc = (v?: string) => (v && v.trim() ? encrypt(v.trim()) : null)
const optionalDec = (v?: string | null) => (v ? decrypt(v) : '')

export const willBuilder = {

  async createWill(pool: Pool, userId: string, data: WillDetails): Promise<string> {
    validateDetails(data)

    // Testator identity comes from the verified account, never from the form
    const [userRow, planId] = await Promise.all([
      pool.query('SELECT aadhaar_hash FROM users WHERE id = $1', [userId]),
      planEnforcer.getCurrentPlanId(pool, userId),
    ])

    // One active will per user: supersede any existing draft/completed will
    await pool.query(`
      UPDATE wills SET status = 'superseded', updated_at = NOW()
      WHERE user_id = $1 AND status IN ('draft','completed')
    `, [userId])

    const validUntil = new Date()
    validUntil.setFullYear(validUntil.getFullYear() + 1)

    const result = await pool.query(`
      INSERT INTO wills (
        user_id,
        testator_name_enc, testator_dob_enc,
        testator_address_enc, testator_pan_enc,
        testator_aadhaar_hash,
        executor_name_enc, executor_relation,
        executor_mobile_enc, alt_executor_name_enc,
        subscription_plan, subscription_valid_until, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'draft')
      RETURNING id
    `, [
      userId,
      encrypt(data.testatorName.trim()),
      encrypt(data.testatorDob),
      encrypt(data.testatorAddress.trim()),
      optionalEnc(data.testatorPan),
      userRow.rows[0]?.aadhaar_hash ?? null,
      encrypt(data.executorName.trim()),
      data.executorRelation.trim(),
      encrypt(data.executorMobile),
      optionalEnc(data.altExecutorName),
      planId === 'pro' || planId === 'b2b' ? 'premium' : 'basic',
      validUntil.toISOString().split('T')[0]
    ])

    const willId = result.rows[0].id
    await auditLogger.log(userId, 'WILL_CREATED', 'will', willId)
    return willId
  },

  async updateWill(pool: Pool, userId: string, willId: string, data: WillDetails): Promise<void> {
    await assertWillOwner(pool, willId, userId)
    validateDetails(data)

    await pool.query(`
      UPDATE wills SET
        testator_name_enc     = $3,
        testator_dob_enc      = $4,
        testator_address_enc  = $5,
        testator_pan_enc      = $6,
        executor_name_enc     = $7,
        executor_relation     = $8,
        executor_mobile_enc   = $9,
        alt_executor_name_enc = $10,
        status                = 'draft',
        updated_at            = NOW()
      WHERE id = $1 AND user_id = $2
    `, [
      willId, userId,
      encrypt(data.testatorName.trim()),
      encrypt(data.testatorDob),
      encrypt(data.testatorAddress.trim()),
      optionalEnc(data.testatorPan),
      encrypt(data.executorName.trim()),
      data.executorRelation.trim(),
      encrypt(data.executorMobile),
      optionalEnc(data.altExecutorName),
    ])
  },

  async addBeneficiary(
    pool: Pool,
    userId: string,
    willId: string,
    data: { name: string; relation: string; dob?: string; mobile?: string; email?: string; address?: string }
  ): Promise<string> {
    await assertWillOwner(pool, willId, userId)

    const name = data.name.trim()
    const existing = await pool.query(
      'SELECT name_enc FROM will_beneficiaries WHERE will_id = $1',
      [willId]
    )
    if (existing.rows.some(r => decrypt(r.name_enc).trim().toLowerCase() === name.toLowerCase())) {
      throw new WillError(`${name} is already a beneficiary.`)
    }

    const result = await pool.query(`
      INSERT INTO will_beneficiaries (
        will_id, user_id, name_enc, relation,
        dob_enc, mobile_enc, email_enc, address_enc
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id
    `, [
      willId, userId,
      encrypt(name),
      data.relation.trim(),
      optionalEnc(data.dob),
      optionalEnc(data.mobile),
      optionalEnc(data.email),
      optionalEnc(data.address),
    ])
    await markDraft(pool, willId)
    return result.rows[0].id
  },

  async removeBeneficiary(pool: Pool, userId: string, willId: string, beneficiaryId: string): Promise<void> {
    await assertWillOwner(pool, willId, userId)
    // Their allocations go too (ON DELETE CASCADE via will_allocations.beneficiary_id)
    const result = await pool.query(
      'DELETE FROM will_beneficiaries WHERE id = $1 AND will_id = $2 AND user_id = $3',
      [beneficiaryId, willId, userId]
    )
    if (!result.rowCount) throw new WillError('Beneficiary not found', 404)
    await markDraft(pool, willId)
  },

  async addAllocation(
    pool: Pool,
    userId: string,
    willId: string,
    data: {
      assetType:            string
      assetRefId?:          string
      assetDescription:     string
      estimatedValuePaise?: number
      beneficiaryId:        string
      allocationPct:        number
      conditionText?:       string
      notes?:               string
    }
  ): Promise<string> {
    await assertWillOwner(pool, willId, userId)

    // Name/relation come from our own record, not from the client
    const ben = await pool.query(
      'SELECT name_enc, relation FROM will_beneficiaries WHERE id = $1 AND will_id = $2 AND user_id = $3',
      [data.beneficiaryId, willId, userId]
    )
    if (!ben.rows[0]) throw new WillError('Beneficiary not found', 404)

    const description = data.assetDescription.trim()
    const pct = Math.round(data.allocationPct * 100) / 100

    // An asset's shares can't exceed 100%. Synced assets are keyed by id; "other" assets by description.
    const existing = data.assetRefId
      ? await pool.query(
          `SELECT COALESCE(SUM(allocation_pct), 0) AS total,
                  COUNT(*) FILTER (WHERE beneficiary_id = $3) AS same_person
           FROM will_allocations WHERE will_id = $1 AND asset_ref_id = $2`,
          [willId, data.assetRefId, data.beneficiaryId])
      : await pool.query(
          `SELECT COALESCE(SUM(allocation_pct), 0) AS total,
                  COUNT(*) FILTER (WHERE beneficiary_id = $3) AS same_person
           FROM will_allocations WHERE will_id = $1 AND asset_ref_id IS NULL AND lower(asset_description) = lower($2)`,
          [willId, description, data.beneficiaryId])

    if (parseInt(existing.rows[0].same_person) > 0) {
      throw new WillError('This beneficiary already has a share of this asset. Remove it first to change the percentage.')
    }
    const currentTotal = parseFloat(existing.rows[0].total)
    if (currentTotal + pct > 100) {
      const remaining = Math.max(0, 100 - currentTotal)
      throw new WillError(
        remaining > 0
          ? `Only ${remaining}% of this asset is left to allocate.`
          : 'This asset is already fully allocated.'
      )
    }

    const result = await pool.query(`
      INSERT INTO will_allocations (
        will_id, user_id, beneficiary_id,
        asset_type, asset_ref_id, asset_description,
        estimated_value_paise,
        beneficiary_name_enc, beneficiary_relation,
        allocation_pct, condition_text, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id
    `, [
      willId, userId, data.beneficiaryId,
      data.assetType, data.assetRefId ?? null,
      description, data.estimatedValuePaise ?? 0,
      ben.rows[0].name_enc,
      ben.rows[0].relation,
      pct,
      data.conditionText ?? null,
      data.notes ?? null
    ])
    await markDraft(pool, willId)
    return result.rows[0].id
  },

  async removeAllocation(pool: Pool, userId: string, willId: string, allocationId: string): Promise<void> {
    await assertWillOwner(pool, willId, userId)
    const result = await pool.query(
      'DELETE FROM will_allocations WHERE id = $1 AND will_id = $2 AND user_id = $3',
      [allocationId, willId, userId]
    )
    if (!result.rowCount) throw new WillError('Allocation not found', 404)
    await markDraft(pool, willId)
  },

  /** The user's active will (latest non-superseded) in the shape the builder UI edits, or null. */
  async getCurrentWill(pool: Pool, userId: string): Promise<any | null> {
    const willRow = await pool.query(`
      SELECT id FROM wills
      WHERE user_id = $1 AND status IN ('draft','completed','signed')
      ORDER BY updated_at DESC
      LIMIT 1
    `, [userId])
    if (!willRow.rows[0]) return null

    const will = await this.getFullWill(pool, userId, willRow.rows[0].id)
    if (!will) return null

    return {
      willId: will.id,
      status: will.status,
      pdfGeneratedAt: will.pdf_generated_at,
      details: {
        testatorName:     will.testatorName,
        testatorDob:      will.testatorDob,
        testatorAddress:  will.testatorAddress,
        testatorPan:      will.testatorPan,
        executorName:     will.executorName,
        executorRelation: will.executor_relation,
        executorMobile:   will.executorMobile,
      },
      beneficiaries: will.beneficiaries.map((b: any) => ({ id: b.id, name: b.name, relation: b.relation })),
      allocations: will.allocations.map((a: any) => ({
        id:               a.id,
        assetType:        a.asset_type,
        assetRefId:       a.asset_ref_id,
        assetDescription: a.asset_description,
        beneficiaryId:    a.beneficiary_id,
        beneficiaryName:  a.beneficiaryName,
        allocationPct:    parseFloat(a.allocation_pct),
      })),
    }
  },

  async generatePDF(pool: Pool, userId: string, willId: string): Promise<Buffer> {
    const will = await this.getFullWill(pool, userId, willId)
    if (!will) throw new WillError('Will not found', 404)
    if (!will.beneficiaries.length) throw new WillError('Add at least one beneficiary before generating your will.')
    if (!will.allocations.length) throw new WillError('Allocate at least one asset before generating your will.')

    const PDFDocument = (await import('pdfkit')).default

    const pdfBuffer: Buffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4', info: { Title: `Will of ${will.testatorName}` } })
      const buffers: Buffer[] = []
      const pdfStream = doc as unknown as NodeJS.ReadableStream
      pdfStream.on('data', (chunk: Buffer | Uint8Array) => buffers.push(Buffer.from(chunk)))
      pdfStream.on('end', () => resolve(Buffer.concat(buffers)))
      pdfStream.on('error', reject)

      // Header / Title
      doc.fontSize(22).font('Helvetica-Bold').fillColor('#111827').text('LAST WILL AND TESTAMENT', { align: 'center' })
      doc.moveDown(0.5)
      doc.fontSize(12).font('Helvetica').fillColor('#4b5563').text(`of ${will.testatorName}`, { align: 'center' })
      doc.moveDown(1.5)

      // Declaration
      doc.fontSize(10.5).font('Helvetica').fillColor('#111827').text(
        `I, ${will.testatorName}, born on ${formatDob(will.testatorDob)}, residing at ${will.testatorAddress}` +
        `${will.testatorPan ? `, holding PAN ${will.testatorPan}` : ''}, being of sound mind and memory and ` +
        'acting of my own free will, declare this to be my last Will and revoke all my earlier wills and codicils.',
        { align: 'justify' }
      )
      doc.moveDown(1)

      // Executor Details
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#111827').text('1. Appointment of Executor')
      doc.moveDown(0.3)
      doc.fontSize(10.5).font('Helvetica').fillColor('#374151')
      doc.text(`I appoint ${will.executorName} (${will.executor_relation}), mobile ${will.executorMobile}, as the Executor of this Will.`)
      if (will.altExecutorName) doc.text(`If they are unable or unwilling to act, I appoint ${will.altExecutorName} as alternate Executor.`)
      doc.moveDown(1)

      // Beneficiaries & Allocations
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#111827').text('2. Bequests')
      doc.moveDown(0.3)
      for (const b of will.beneficiaries) {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1f2937').text(`${b.name} (${b.relation})`)
        const allocations = will.allocations.filter((a: any) =>
          a.beneficiary_id ? a.beneficiary_id === b.id : a.beneficiaryName === b.name)
        if (allocations.length > 0) {
          for (const a of allocations) {
            doc.fontSize(10).font('Helvetica').fillColor('#4b5563')
              .text(`  •  ${parseFloat(a.allocation_pct)}% of ${a.asset_description}`)
          }
        } else {
          doc.fontSize(10).font('Helvetica-Oblique').fillColor('#9ca3af').text('  No specific assets allocated.')
        }
        doc.moveDown(0.4)
      }
      doc.moveDown(0.6)
      doc.fontSize(10.5).font('Helvetica').fillColor('#374151')
        .text('Any of my assets not specifically mentioned above shall be distributed in accordance with applicable law.')
      doc.moveDown(1.5)

      // Signatures
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#111827').text('3. Signatures')
      doc.moveDown(0.8)
      doc.font('Helvetica').text('Signature of Testator: ______________________      Date: ____________      Place: ____________')
      doc.moveDown(1.2)
      doc.fontSize(9.5).fillColor('#374151').text(
        'Signed by the Testator in our presence, and attested by us in the presence of the Testator and of each other. ' +
        'Witnesses must be adults and must not be beneficiaries under this Will.'
      )
      doc.moveDown(1)
      doc.fontSize(10.5).fillColor('#111827')
      doc.text('Witness 1 — Name: ______________________   Signature: ______________________')
      doc.moveDown(0.8)
      doc.text('Witness 2 — Name: ______________________   Signature: ______________________')
      doc.moveDown(2)

      // Legal Disclaimer
      doc.fontSize(8.5).font('Helvetica-Oblique').fillColor('#6b7280').text(WILL_DISCLAIMER, { align: 'justify' })

      doc.end()
    })

    // Keep a copy in S3 when configured; the download works either way
    let s3Key: string | null = null
    if (process.env.AWS_REGION && process.env.S3_BUCKET_DOCUMENTS) {
      try {
        const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
        const s3 = new S3Client({ region: process.env.AWS_REGION })
        s3Key = `wills/${userId}/${willId}/will-v${will.will_version}.pdf`
        await s3.send(new PutObjectCommand({
          Bucket:      process.env.S3_BUCKET_DOCUMENTS,
          Key:         s3Key,
          Body:        pdfBuffer,
          ContentType: 'application/pdf',
          ServerSideEncryption: 'AES256',
          Metadata:    { userId, willId }
        }))
      } catch (s3Err) {
        s3Key = null
        console.warn('Will PDF S3 upload failed:', (s3Err as Error).message)
      }
    }

    await pool.query(`
      UPDATE wills
      SET pdf_s3_key = COALESCE($3, pdf_s3_key), pdf_generated_at = NOW(),
          status = 'completed', updated_at = NOW()
      WHERE id = $1 AND user_id = $2
    `, [willId, userId, s3Key])

    await auditLogger.log(userId, 'WILL_PDF_GENERATED', 'will', willId)

    return pdfBuffer
  },

  async initiateESign(
    pool: Pool,
    userId: string,
    willId: string
  ): Promise<string> {
    // DigiSign / Zoho Sign API integration
    // Returns redirect URL for user to sign
    const willRow = await pool.query(`
      SELECT w.pdf_s3_key, w.testator_name_enc, u.email_encrypted
      FROM wills w
      JOIN users u ON u.id = w.user_id
      WHERE w.id = $1 AND w.user_id = $2
    `, [willId, userId])
    const will = willRow.rows[0]
    if (!will) throw new WillError('Will not found', 404)
    if (!will.pdf_s3_key) throw new WillError('Generate your will PDF before signing.')
    if (!will.email_encrypted) throw new WillError('Add an email address to your account to sign the will.')

    const response = await axios.post(
      'https://api.zoho.com/sign/v1/requests',
      {
        templates: { field_data: { field_text_data: {} } },
        actions: [{
          recipient_name:  decrypt(will.testator_name_enc),
          recipient_email: decrypt(will.email_encrypted),
          action_type:     'SIGN',
          signing_order:    1
        }],
        notes: 'AssetMap Will Document — ' + new Date().toLocaleDateString()
      },
      { headers: { Authorization: `Zoho-oauthtoken ${process.env.ZOHO_SIGN_TOKEN}` } }
    )

    const signRef = response.data?.requests?.request_id

    await pool.query(`
      UPDATE wills
      SET esign_ref = $2, esign_status = 'pending', updated_at = NOW()
      WHERE id = $1 AND user_id = $3
    `, [willId, signRef, userId])

    return response.data?.requests?.sign_url
  },

  async getFullWill(
    pool: Pool,
    userId: string,
    willId: string
  ): Promise<any | null> {
    const [willResult, allocResult, benResult] = await Promise.all([
      pool.query('SELECT * FROM wills WHERE id=$1 AND user_id=$2',
        [willId, userId]),
      pool.query(
        `SELECT * FROM will_allocations
         WHERE will_id=$1 AND user_id=$2 ORDER BY created_at`,
        [willId, userId]
      ),
      pool.query(
        'SELECT * FROM will_beneficiaries WHERE will_id=$1 AND user_id=$2 ORDER BY created_at',
        [willId, userId]
      )
    ])

    if (!willResult.rows[0]) return null

    const will = willResult.rows[0]
    return {
      ...will,
      testatorName:    decrypt(will.testator_name_enc),
      testatorDob:     decrypt(will.testator_dob_enc),
      testatorAddress: optionalDec(will.testator_address_enc),
      testatorPan:     optionalDec(will.testator_pan_enc),
      executorName:    decrypt(will.executor_name_enc),
      executorMobile:  optionalDec(will.executor_mobile_enc),
      altExecutorName: will.alt_executor_name_enc ? decrypt(will.alt_executor_name_enc) : null,
      testator_name_enc:    undefined,
      testator_dob_enc:     undefined,
      testator_address_enc: undefined,
      testator_pan_enc:     undefined,
      testator_aadhaar_hash: undefined,
      executor_name_enc:    undefined,
      executor_mobile_enc:  undefined,
      alt_executor_name_enc: undefined,
      allocations: allocResult.rows.map(a => ({
        ...a,
        beneficiaryName: decrypt(a.beneficiary_name_enc),
        beneficiary_name_enc: undefined
      })),
      beneficiaries: benResult.rows.map(b => ({
        ...b,
        name:   decrypt(b.name_enc),
        mobile: b.mobile_enc ? decrypt(b.mobile_enc) : null,
        name_enc: undefined, mobile_enc: undefined, aadhaar_hash: undefined
      }))
    }
  }
}
