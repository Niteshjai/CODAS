// Formatting + parsing helpers for the account detail page.

export type DetailValue = string | number | null;

export interface AssetTxn {
  id: string;
  date: string;
  narration: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceAfter: number | null;
  mode: string | null;
  reference: string | null;
  category: string | null;
}

export interface AssetDetailData {
  asset: { id: string; fiType: string; institutionName: string; accountRef: string; balance: number; currency: string; fetchedAt: string };
  details: Record<string, DetailValue>;
  holdings: { name: string; units: number | null; nav: number | null; value: number | null }[];
  nominee: { status: 'registered' | 'missing' | 'in_progress' | 'unknown'; lastCheckedAt: string | null };
  history: { date: string; balance: number }[];
  transactions: AssetTxn[];
}

// ─── Money ───

export const inr = (n: number, decimals = 2) =>
  `${n < 0 ? '−' : ''}₹${Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

/** ₹1.55L / ₹12.5K / ₹1.2Cr — fixed 2dp for lakh/crore so axis labels line up (₹1.50L, ₹1.55L). */
export function compactInr(n: number, decimals?: number): string {
  const sign = n < 0 ? '−' : '';
  const a = Math.abs(n);
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(decimals ?? 2)}Cr`;
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(decimals ?? 2)}L`;
  if (a >= 1e3) return `${sign}₹${+(a / 1e3).toFixed(decimals ?? 1)}K`;
  return `${sign}₹${Math.round(a)}`;
}

/** "Nice" axis ticks (1/2/2.5/5 × 10ⁿ steps) spanning [min, max]. */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) { const pad = Math.abs(max) * 0.05 || 1; min -= pad; max += pad; }
  const rawStep = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= rawStep) ?? 10 * mag;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}

/** Formatter that adds precision until every tick label is unique. */
export function uniqueTickFormatter(ticks: number[]): (v: number) => string {
  for (const d of [1, 2, 3]) {
    const labels = ticks.map(t => compactInr(t, d));
    if (new Set(labels).size === labels.length) return (v: number) => compactInr(v, d);
  }
  return (v: number) => inr(v, 0);
}

// ─── Dates ───

export function fmtDate(v: string | null | undefined, opts: { time?: boolean; year?: boolean } = {}) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
    ...(opts.year === false ? {} : { year: 'numeric' }),
    ...(opts.time ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

export function relativeTime(v: string) {
  const mins = Math.round((Date.now() - new Date(v).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.round(days / 30);
  return months < 12 ? `${months} month${months > 1 ? 's' : ''} ago` : fmtDate(v)!;
}

export const daysBetween = (from: number, to: number) => Math.floor((to - from) / 86400000);

export function daysUntil(v: DetailValue): number | null {
  if (typeof v !== 'string') return null;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? null : Math.ceil((t - Date.now()) / 86400000);
}

export const titleCase = (v: string) =>
  v.toLowerCase().replace(/\b[\p{L}]/gu, c => c.toUpperCase());

export function labelOf(v: DetailValue): string | null {
  if (v === null || v === undefined || v === '') return null;
  return typeof v === 'string' ? titleCase(v.replace(/[_-]+/g, ' ')) : String(v);
}

// ─── Transaction narration → title, mode, reference ───

export type TxnMode =
  | 'UPI' | 'NEFT' | 'IMPS' | 'RTGS' | 'ATM' | 'CARD' | 'AUTOPAY'
  | 'INTEREST' | 'CHARGES' | 'CHEQUE' | 'SALARY' | 'OTHER';

export const MODE_LABEL: Record<TxnMode, string> = {
  UPI: 'UPI', NEFT: 'NEFT', IMPS: 'IMPS', RTGS: 'RTGS', ATM: 'ATM withdrawal', CARD: 'Card',
  AUTOPAY: 'Auto-debit', INTEREST: 'Interest', CHARGES: 'Bank charges', CHEQUE: 'Cheque',
  SALARY: 'Salary', OTHER: 'Transfer',
};

const MODE_RULES: [TxnMode, RegExp][] = [
  ['UPI', /\bUPI\b/],
  ['IMPS', /\bIMPS\b|\bMMT\b/],
  ['NEFT', /\bNEFT\b/],
  ['RTGS', /\bRTGS\b/],
  ['ATM', /\bATM\b|\bATW\b|\bNWD\b|CASH\s*WDL|CASH\s*WITHDRAWAL/],
  ['CARD', /\bPOS\b|\bECOM\b|DEBIT\s*CARD|CREDIT\s*CARD|\bCARD\b/],
  ['AUTOPAY', /\bNACH\b|\bACH\b|\bECS\b|\bMANDATE\b|STANDING\s*INSTRUCTION/],
  ['INTEREST', /\bINT\.?\s*(PD|CR|PAID|CREDIT)\b|\bINTEREST\b|\bSB\s*INT\b/],
  ['CHARGES', /\bCHGS?\b|\bCHARGES?\b|\bFEE\b|\bMIN\s*BAL\b|\bSMS\s*ALERT\b/],
  ['CHEQUE', /\bCHQ\b|\bCHEQUE\b|\bCLG\b|\bCLEARING\b/],
  ['SALARY', /\bSALARY\b|\bSAL\b/],
];

const NOISE = new Set([
  'UPI', 'NEFT', 'IMPS', 'RTGS', 'POS', 'ATM', 'ATW', 'NWD', 'NACH', 'ACH', 'ECS', 'MMT', 'ECOM',
  'CR', 'DR', 'P2A', 'P2M', 'P2P', 'MB', 'IB', 'INB', 'BY', 'TO', 'TRF', 'TFR', 'REF', 'PAY', 'PAYMENT',
  'YESB', 'HDFC', 'ICIC', 'SBIN', 'UTIB', 'KKBK', 'PUNB', 'BARB', 'IDFB', 'AIRP', 'PYTM', 'INDB', 'CNRB', 'UBIN', 'FDRL', 'IBKL',
]);

export interface ParsedNarration { title: string; mode: TxnMode; modeLabel: string; reference: string | null; handle: string | null }

function niceWord(token: string): string {
  // Keep short acronyms (AWS, LIC, EMI); title-case the rest
  return token.split(/\s+/).map(w => (/^[A-Z0-9&]{2,4}$/.test(w) ? w : titleCase(w))).join(' ');
}

export function parseNarration(narration: string, modeHint?: string | null, referenceHint?: string | null): ParsedNarration {
  const upper = (narration || '').toUpperCase();
  const hint = (modeHint || '').toUpperCase();
  const mode = (MODE_RULES.find(([, re]) => re.test(upper) || (hint && re.test(hint)))?.[0]) ?? 'OTHER';

  let reference = referenceHint || null;
  let handle: string | null = null;
  let title = '';

  const tokens = narration.split(/[/|:]+|\s-\s|\s{2,}/).map(t => t.trim()).filter(Boolean);
  for (const tok of tokens) {
    const t = tok.toUpperCase();
    if (/^\d{5,}$/.test(t)) { reference ??= tok; continue; }
    if (tok.includes('@')) { handle ??= tok.toLowerCase(); continue; }
    if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(t)) continue;           // IFSC
    if (NOISE.has(t) || !/[A-Z]/.test(t)) continue;
    if (!title) title = tok.replace(/\s+/g, ' ');
  }
  if (!title && handle) title = handle.split('@')[0].replace(/[._-]+/g, ' ');
  title = title ? niceWord(title.length > 48 ? `${title.slice(0, 48)}…` : title) : `${MODE_LABEL[mode]} ${mode === 'OTHER' ? '' : 'transaction'}`.trim();

  return { title, mode, modeLabel: MODE_LABEL[mode], reference, handle };
}

/** Interest credits and bank charges don't count as the customer using the account (RBI inoperative-account rule). */
export const isCustomerInitiated = (t: AssetTxn) => {
  const m = parseNarration(t.narration, t.mode).mode;
  return m !== 'INTEREST' && m !== 'CHARGES';
};

// ─── Institution monogram ───

const BANK_STYLES: [RegExp, string, string][] = [
  [/HDFC/i, 'HDFC', '#004C8F'],
  [/STATE BANK|\bSBI\b/i, 'SBI', '#1D4E9E'],
  [/ICICI/i, 'ICICI', '#AE282E'],
  [/AXIS/i, 'AXIS', '#97144D'],
  [/KOTAK/i, 'KMB', '#D7262B'],
  [/\bLIC\b|LIFE INSURANCE/i, 'LIC', '#0B5394'],
  [/ZERODHA/i, 'Z', '#387ED1'],
  [/GROWW/i, 'G', '#00B386'],
  [/NSDL|CRA|PENSION/i, 'NPS', '#2E5E4E'],
];

export function monogram(name: string): { text: string; color: string } {
  const hit = BANK_STYLES.find(([re]) => re.test(name));
  if (hit) return { text: hit[1], color: hit[2] };
  const initials = name.replace(/[^\p{L}\s]/gu, '').split(/\s+/).filter(w => w && !/^(of|the|and|bank|ltd|limited)$/i.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return { text: initials || name.slice(0, 2).toUpperCase(), color: `hsl(${h} 45% 38%)` };
}
