import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import { trustedDeviceService } from '../../src/auth/trustedDeviceService';
import { pool } from '../../src/db/connection';
import crypto from 'crypto';

export function registerTrustedDeviceServiceTests() {
  describe('trustedDeviceService (30-Day Device Trust)', () => {
    let testUserId: string;

    beforeAll(async () => {
      const res = await pool.query(`
        INSERT INTO users (aadhaar_hash, name_encrypted)
        VALUES ($1, $2)
        RETURNING id
      `, [crypto.randomBytes(16).toString('hex'), 'Device Test User']);
      testUserId = res.rows[0].id;
    });

    afterAll(async () => {
      if (testUserId) {
        await pool.query('DELETE FROM trusted_devices WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      }
    });

    it('trusts a new device and returns a 32-byte hex token', async () => {
      const token = await trustedDeviceService.trustDevice(pool, testUserId, {
        ip: '192.168.1.10',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        deviceName: 'Work PC'
      });

      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes hex = 64 characters

      // Verify stored in DB with correct parsed fields
      const rows = await trustedDeviceService.listDevices(pool, testUserId);
      expect(rows).toHaveLength(1);
      expect(rows[0].device_name).toBe('Work PC');
      expect(rows[0].browser).toBe('Chrome');
      expect(rows[0].os).toBe('Windows');
      expect(rows[0].device_type).toBe('desktop');
    });

    it('verifies that a trusted device token is valid (isTrusted)', async () => {
      const token = await trustedDeviceService.trustDevice(pool, testUserId, {
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15'
      });

      const isTrusted = await trustedDeviceService.isTrusted(pool, testUserId, token);
      expect(isTrusted).toBe(true);
    });

    it('rejects an invalid device token', async () => {
      const isTrusted = await trustedDeviceService.isTrusted(pool, testUserId, 'invalid-random-token-here');
      expect(isTrusted).toBe(false);
    });

    it('revokes an individual device by device ID', async () => {
      const token = await trustedDeviceService.trustDevice(pool, testUserId, {
        ip: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
      });

      const devices = await trustedDeviceService.listDevices(pool, testUserId);
      const targetDevice = devices.find(d => d.device_type === 'mobile');
      expect(targetDevice).toBeDefined();

      // Revoke it
      await trustedDeviceService.revokeDevice(pool, testUserId, targetDevice.id);

      // Verify token is no longer trusted
      const isTrusted = await trustedDeviceService.isTrusted(pool, testUserId, token);
      expect(isTrusted).toBe(false);
    });

    it('revokes ALL devices for a user', async () => {
      const token1 = await trustedDeviceService.trustDevice(pool, testUserId, { ip: '1.1.1.1', userAgent: 'Chrome/120' });
      const token2 = await trustedDeviceService.trustDevice(pool, testUserId, { ip: '2.2.2.2', userAgent: 'Firefox/120' });

      await trustedDeviceService.revokeAllDevices(pool, testUserId);

      expect(await trustedDeviceService.isTrusted(pool, testUserId, token1)).toBe(false);
      expect(await trustedDeviceService.isTrusted(pool, testUserId, token2)).toBe(false);

      const activeDevices = await trustedDeviceService.listDevices(pool, testUserId);
      expect(activeDevices).toHaveLength(0);
    });

  });
}
