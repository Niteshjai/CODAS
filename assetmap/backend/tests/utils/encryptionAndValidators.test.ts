import { describe, it, expect } from '../testFramework';
import {
  encryptPII,
  decryptPII,
  hashAadhaar,
  hashMobile,
  hashEmail,
  verifyAadhaarHash,
  hashSHA256,
  generateSecureToken
} from '../../src/utils/encryption';
import {
  AadhaarInitiateSchema,
  PhoneInitiateSchema,
  RegisterPanSchema
} from '../../src/utils/validators';

export function registerEncryptionAndValidatorsTests() {
  describe('encryption & validators (Security & Data Integrity)', () => {

    it('encrypts and decrypts PII strings with AES-256-GCM', () => {
      const plaintext = 'Nitesh Kumar Jaiswal - Confidential Data 12345';
      const encrypted = encryptPII(plaintext);

      expect(typeof encrypted).toBe('string');
      expect(encrypted).toContain(':'); // iv:authTag:ciphertext format
      expect(encrypted.split(':')).toHaveLength(3);

      const decrypted = decryptPII(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('produces unique ciphertexts for identical plaintext (random IV)', () => {
      const text = 'Identical Plaintext';
      const enc1 = encryptPII(text);
      const enc2 = encryptPII(text);

      expect(enc1).not.toBe(enc2);
      expect(decryptPII(enc1)).toBe(text);
      expect(decryptPII(enc2)).toBe(text);
    });

    it('fails to decrypt tampered ciphertexts', () => {
      const encrypted = encryptPII('Secret payload');
      const [iv, authTag, ciphertext] = encrypted.split(':');
      const tampered = `${iv}:${authTag}:${ciphertext.slice(0, -2)}ff`;

      let threw = false;
      try {
        decryptPII(tampered);
      } catch {
        threw = true;
      }
      expect(threw).toBe(true);
    });

    it('hashes Aadhaar, Mobile, and Email deterministically with salt', () => {
      const aadhaar = '1234 5678 9012';
      const hash1 = hashAadhaar(aadhaar);
      const hash2 = hashAadhaar('123456789012'); // whitespace normalized

      expect(hash1).toBe(hash2);
      expect(verifyAadhaarHash(aadhaar, hash1)).toBe(true);
      expect(verifyAadhaarHash('999988887777', hash1)).toBe(false);

      const phoneHash = hashMobile('+91 9876543210');
      expect(phoneHash).toBe(hashMobile('+919876543210'));

      const emailHash = hashEmail('USER@Example.Com');
      expect(emailHash).toBe(hashEmail('user@example.com'));
    });

    it('generates cryptographically secure random hex tokens', () => {
      const token = generateSecureToken(32);
      expect(typeof token).toBe('string');
      expect(token).toHaveLength(64);
    });

  });
}
