import { isIP } from 'net'

/**
 * Normalise a client address for rate-limit keys and the audit log's `inet` column.
 * Azure App Service forwards IPv4 clients as "1.2.3.4:56789" (with the source port), which
 * would give every request its own rate-limit bucket and makes the `::inet` cast fail.
 * Returns null when the value isn't an IP address at all.
 */
export function normalizeIp(raw: string | undefined | null): string | null {
  if (!raw) return null
  let ip = raw.trim()
  // "[2001:db8::1]:443" → "2001:db8::1"
  const bracketed = ip.match(/^\[([^\]]+)\](?::\d+)?$/)
  if (bracketed) ip = bracketed[1]
  // "1.2.3.4:56789" → "1.2.3.4" (exactly one colon means IPv4 with a port, never IPv6)
  else if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(ip)) ip = ip.slice(0, ip.lastIndexOf(':'))
  // IPv4-mapped IPv6 → plain IPv4, so the same client gets the same key either way
  if (ip.toLowerCase().startsWith('::ffff:') && isIP(ip.slice(7)) === 4) ip = ip.slice(7)
  return isIP(ip) ? ip : null
}
