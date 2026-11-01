import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// ─────────────────────────────────────────────
// AES-256-GCM Encryption Utility
// Uses ENCRYPTION_KEY from environment (.env)
// ─────────────────────────────────────────────

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

const KEY_LENGTH = 32 // AES-256

/**
 * Must be the same key AssetMap uses: this worker decrypts the
 * users.*_encrypted columns that AssetMap writes.
 */
export function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY not set in environment')
  const buf = Buffer.from(key, 'hex')
  if (buf.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters)`)
  }
  return buf
}

/**
 * Encrypt a plaintext string.
 * Returns: iv:authTag:ciphertext (all hex-encoded, colon-delimited)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return ''

  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return [
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted
  ].join(':')
}

/**
 * Decrypt an encrypted string produced by encrypt().
 * Expects format: iv:authTag:ciphertext (hex-encoded)
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''

  const [ivHex, authTagHex, ciphertext] = encryptedText.split(':')
  if (!ivHex || !authTagHex || !ciphertext) {
    throw new Error('Invalid encrypted text format — expected iv:authTag:ciphertext')
  }

  const key = getKey()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)

  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

/**
 * Encrypt a value only if it's non-null/non-empty.
 * Convenience wrapper for optional fields.
 */
export function encryptOptional(value: string | null | undefined): string | null {
  if (!value) return null
  return encrypt(value)
}

/**
 * Decrypt a value only if it's non-null/non-empty.
 * Convenience wrapper for optional fields.
 */
export function decryptOptional(value: string | null | undefined): string | null {
  if (!value) return null
  return decrypt(value)
}
