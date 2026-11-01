import { ERROR_CODES } from '../utils/constants'

/** Expected, user-facing failure in the spend analyser (validation, not found). */
export class SpendError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = statusCode === 404 ? ERROR_CODES.NOT_FOUND : ERROR_CODES.VALIDATION_ERROR,
  ) {
    super(message)
  }
}

export const MONTH_PATTERN = '^[0-9]{4}-(0[1-9]|1[0-2])$'

/** 'YYYY-MM' for a date (UTC calendar month of a DATE column value). */
export function monthKeyOf(d: Date | string): string {
  if (typeof d === 'string') return d.slice(0, 7)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function currentMonthKey(now = new Date()): string {
  return monthKeyOf(now)
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return monthKeyOf(d)
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function monthLabel(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
}
