import { describe, it, expect } from '../testFramework';
import { totpService } from '../../src/auth/totpService';
import speakeasy from 'speakeasy';
import { decryptPII } from '../../src/utils/encryption';

export function registerTotpServiceTests() {
  describe('totpService (Authenticator 2FA)', () => {
    
    it('generates a valid TOTP secret with otpauth URL and encryption', () => {
      const username = 'testuser@example.com';
      const result = totpService.generateSecret(username);

      expect(result).toBeDefined();
      expect(typeof result.secret).toBe('string');
      expect(result.secret.length).toBeGreaterThan(15);
      expect(typeof result.encryptedSecret).toBe('string');
      expect(result.qrCodeUrl).toContain('otpauth://totp/');
      expect(result.qrCodeUrl).toContain(encodeURIComponent(username));

      // Decrypted secret must match raw secret
      const decrypted = decryptPII(result.encryptedSecret);
      expect(decrypted).toBe(result.secret);
    });

    it('generates a valid base64 QR code image from otpauth URL', async () => {
      const { qrCodeUrl } = totpService.generateSecret('qrcode_user');
      const qrDataUrl = await totpService.generateQRCode(qrCodeUrl);

      expect(typeof qrDataUrl).toBe('string');
      expect(qrDataUrl.startsWith('data:image/png;base64,')).toBe(true);
    });

    it('verifies a current valid TOTP token successfully', () => {
      const { secret, encryptedSecret } = totpService.generateSecret('valid_user');
      
      // Generate current token using speakeasy
      const currentToken = speakeasy.totp({
        secret,
        encoding: 'base32',
      });

      const verification = totpService.verifyToken(encryptedSecret, currentToken);
      expect(verification.valid).toBe(true);
    });

    it('accepts tokens with spaces or hyphens gracefully', () => {
      const { secret, encryptedSecret } = totpService.generateSecret('formatted_user');
      const currentToken = speakeasy.totp({
        secret,
        encoding: 'base32',
      });

      const formattedToken = `${currentToken.slice(0, 3)} - ${currentToken.slice(3)}`;
      const verification = totpService.verifyToken(encryptedSecret, formattedToken);
      expect(verification.valid).toBe(true);
    });

    it('rejects an invalid TOTP token', () => {
      const { encryptedSecret } = totpService.generateSecret('invalid_user');
      const verification = totpService.verifyToken(encryptedSecret, '000000');
      expect(verification.valid).toBe(false);
    });

    it('returns valid: false when given corrupted encrypted secret', () => {
      const verification = totpService.verifyToken('not-a-valid-encrypted-string', '123456');
      expect(verification.valid).toBe(false);
    });

  });
}
