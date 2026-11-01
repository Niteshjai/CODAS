import { kvStore } from '../db/connection'

const OTP_ATTEMPTS_PREFIX = 'otp_attempts:'
const OTP_LOCK_PREFIX = 'otp_lock:'

export const otpGuard = {
  async recordFailure(mobile: string): Promise<number> {
    const key = `${OTP_ATTEMPTS_PREFIX}${mobile}`
    const attempts = await kvStore.incr(key)
    await kvStore.expire(key, 60 * 60)
    if (attempts >= 5) {
      await kvStore.setex(`${OTP_LOCK_PREFIX}${mobile}`, 60 * 5, '1')
    }
    return attempts
  },

  async isLocked(mobile: string): Promise<boolean> {
    return !!(await kvStore.get(`${OTP_LOCK_PREFIX}${mobile}`))
  },

  /**
   * Fixed-window counter keyed by what is being protected (a hashed phone or Aadhaar number),
   * so people sharing one office/college IP don't lock each other out. False once over `max`.
   * The increment and its TTL are one atomic step, so a crash can't leave a counter that never
   * expires and locks that phone/Aadhaar out for good.
   */
  async allow(scope: string, id: string, max: number, windowSec: number): Promise<boolean> {
    const count = await kvStore.incrWithTtl(`otp_rate:${scope}:${id}`, windowSec)
    return count <= max
  },

  async clearOnSuccess(mobile: string): Promise<void> {
    await kvStore.del(`${OTP_ATTEMPTS_PREFIX}${mobile}`)
  }
}
