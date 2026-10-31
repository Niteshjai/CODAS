import { lookup } from 'dns/promises'
import net from 'net'

// Partner-supplied webhook URLs must not reach internal services (SSRF).
// Checked at registration time and again before every delivery (DNS can change).

const blockedRanges = new net.BlockList()
blockedRanges.addSubnet('0.0.0.0', 8, 'ipv4')
blockedRanges.addSubnet('10.0.0.0', 8, 'ipv4')
blockedRanges.addSubnet('100.64.0.0', 10, 'ipv4')
blockedRanges.addSubnet('127.0.0.0', 8, 'ipv4')
blockedRanges.addSubnet('169.254.0.0', 16, 'ipv4') // link-local + cloud metadata
blockedRanges.addSubnet('172.16.0.0', 12, 'ipv4')
blockedRanges.addSubnet('192.168.0.0', 16, 'ipv4')
blockedRanges.addSubnet('224.0.0.0', 4, 'ipv4')
blockedRanges.addSubnet('240.0.0.0', 4, 'ipv4')
blockedRanges.addAddress('::', 'ipv6')
blockedRanges.addAddress('::1', 'ipv6')
blockedRanges.addSubnet('fc00::', 7, 'ipv6')
blockedRanges.addSubnet('fe80::', 10, 'ipv6')

function isBlockedAddress(address: string, family: number): boolean {
  // IPv4-mapped IPv6 (::ffff:10.0.0.1) must be checked as IPv4
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)
  if (mapped) return blockedRanges.check(mapped[1], 'ipv4')
  return blockedRanges.check(address, family === 6 ? 'ipv6' : 'ipv4')
}

export async function assertSafeWebhookUrl(rawUrl: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error('Invalid webhook URL')
  }
  if (url.protocol !== 'https:') {
    throw new Error('Webhook URL must use https')
  }

  const addresses = await lookup(url.hostname, { all: true })
  if (addresses.length === 0 || addresses.some(a => isBlockedAddress(a.address, a.family))) {
    throw new Error('Webhook URL resolves to a disallowed address')
  }
  return url
}
