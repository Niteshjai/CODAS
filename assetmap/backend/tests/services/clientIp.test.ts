import { describe, it, expect } from '../testFramework';
import { normalizeIp } from '../../src/utils/clientIp';

export function registerClientIpTests() {
  describe('normalizeIp (rate-limit keys and audit inet column)', () => {
    it('strips the port Azure appends to IPv4 clients', () => {
      expect(normalizeIp('203.0.113.7:56789')).toBe('203.0.113.7');
      expect(normalizeIp('203.0.113.7')).toBe('203.0.113.7');
    });
    it('handles IPv6, bracketed IPv6 with port and IPv4-mapped addresses', () => {
      expect(normalizeIp('2001:db8::1')).toBe('2001:db8::1');
      expect(normalizeIp('[2001:db8::1]:443')).toBe('2001:db8::1');
      expect(normalizeIp('::ffff:203.0.113.7')).toBe('203.0.113.7');
    });
    it('rejects values that are not IP addresses', () => {
      expect(normalizeIp('unknown')).toBeNull();
      expect(normalizeIp('')).toBeNull();
      expect(normalizeIp(undefined)).toBeNull();
    });
  });
}
