import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// ─────────────────────────────────────────────
// AES-256-GCM Encryption Utility
// Same format as the backend's encryptPII / decryptPII:
// iv:authTag:ciphertext, all hex. Uses ENCRYPTION_KEY.
// ─────────────────────────────────────────────

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

const KEY_LENGTH = 32 // AES-256

let cachedKey: Buffer | undefined

/**
 * Must be the same key AssetMap uses: this worker decrypts the
 * users.*_encrypted columns and the AA / land / unclaimed tables the backend writes.
 */
export function getKey(): Buffer {
  if (cachedKey) return cachedKey
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY not set in environment')
  if (!/^[0-9a-fA-F]+$/.test(key)) throw new Error('ENCRYPTION_KEY must be hex')
  const buf = Buffer.from(key, 'hex')
  if (buf.length !== KEY_LENGTH) {
    throw new Error(`ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters)`)
  }
  cachedKey = buf
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
 * Decrypt an encrypted string produced by encrypt() or the backend's encryptPII().
 * Expects format: iv:authTag:ciphertext (hex-encoded). The backend's
 * encryptPII('') yields 'iv:tag:' (empty ciphertext); that decrypts to ''.
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''

  const parts = encryptedText.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format — expected iv:authTag:ciphertext')
  }
  const [ivHex, authTagHex, ciphertext] = parts
  if (!ivHex || !authTagHex) {
    throw new Error('Invalid encrypted text format — missing iv or auth tag')
  }

  const key = getKey()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  // Reject truncated GCM tags (Node accepts 4-16 bytes), as the backend does
  if (authTag.length !== AUTH_TAG_LENGTH) throw new Error('Invalid auth tag')

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH })
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
