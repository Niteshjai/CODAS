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
  for (let v = start; ticks.length < 2 || ticks[ticks.length - 1] < max; v += step) ticks.push(Math.round(v * 100) / 100);
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
  'UPI', 'NEFT', 'IMPS', 'RTGS', 'POS', 'ATM', 'ATW', 'NWD', 'NACH', 'ACH', 'ECS', 'MMT', 'ECOM', 'TP',
  'CR', 'DR', 'C', 'D', 'P2A', 'P2M', 'P2P', 'MB', 'IB', 'INB', 'BY', 'TO', 'TRF', 'TFR', 'REF', 'TXN',
  'YESB', 'HDFC', 'ICIC', 'SBIN', 'UTIB', 'KKBK', 'PUNB', 'BARB', 'IDFB', 'AIRP', 'PYTM', 'INDB', 'CNRB', 'UBIN', 'FDRL', 'IBKL',
]);

// Modes whose counterparty text is meaningless to people (terminal IDs, period strings)
const FIXED_TITLE: Partial<Record<TxnMode, string>> = { ATM: 'Cash withdrawal', INTEREST: 'Interest credited', CHARGES: 'Bank charges' };

export interface ParsedNarration { title: string; mode: TxnMode; modeLabel: string; reference: string | null; handle: string | null }

const ACRONYMS = new Set(['LIC', 'EMI', 'SIP', 'AWS', 'ATM', 'UPI', 'SBI', 'HDFC', 'ICICI', 'IRCTC', 'BSNL', 'NPS', 'PPF', 'EPF', 'GST', 'HUF', 'IT', 'TDS', 'BESCOM', 'MSEB']);
function niceWord(token: string): string {
  return token.split(/\s+/).map(w => (ACRONYMS.has(w.toUpperCase()) ? w.toUpperCase() : titleCase(w))).join(' ');
}

const isRefLike = (w: string) => /^\d{6,}$/.test(w) || /^(?=.*\d)(?=.*[A-Z])[A-Z0-9]{9,}$/.test(w);
const isJunk = (w: string) =>
  /^\d+X+\d*$/i.test(w) ||                      // masked card 512345XXXXXX1234
  /^[A-Z]{4}0[A-Z0-9]{6}$/.test(w) ||             // IFSC
  /^(?=.*\d)(?=.*[A-Z])[A-Z0-9]{5,8}$/.test(w) || // terminal ids like S1ANBG12
  !/[A-Z]/.test(w);                               // dates, amounts, fragments

export function parseNarration(narration: string, modeHint?: string | null, referenceHint?: string | null): ParsedNarration {
  const text = narration || '';
  const upper = text.toUpperCase();
  const hint = (modeHint || '').toUpperCase();
  const mode = (MODE_RULES.find(([, re]) => re.test(upper) || (hint && re.test(hint)))?.[0]) ?? 'OTHER';

  let reference = referenceHint || null;
  let handle: string | null = null;
  let title = '';
  const separated = /[/|:]|-/.test(text);

  for (const raw of text.split(/[/|:]+|-+/)) {
    const tok = raw.trim();
    if (!tok) continue;
    if (tok.includes('@')) { handle ??= tok.toLowerCase(); continue; }
    // Strip mode words / ids inside the token ("NEFT CR", "POS 512345XXXX1234 AMAZON PAY")
    let leading = true;
    const words = tok.split(/\s+/).filter(w => {
      const W = w.toUpperCase();
      if (/\d/.test(W) && /[A-Z]/.test(W) && isJunk(W)) return false; // masked cards, IFSC, terminal ids
      if (isRefLike(W)) { reference ??= w; return false; }
      const drop = (separated || leading) && (NOISE.has(W) || isJunk(W));
      if (!drop) leading = false;
      return !drop;
    });
    const rest = words.join(' ').trim();
    if (!rest || !/[A-Za-z]{2,}/.test(rest)) continue;
    if (!title) title = rest;
  }
  if (!title && handle) title = handle.split('@')[0].replace(/[._-]+/g, ' ');
  title = FIXED_TITLE[mode] ?? (title
    ? niceWord(title.length > 40 ? `${title.slice(0, 40).trim()}…` : title)
    : mode === 'OTHER' ? 'Transfer' : `${MODE_LABEL[mode]} transaction`);

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

// ─── Shared class strings ───

export const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background';
export const SECTION =
  'rounded-[1.25rem] border border-border bg-card text-card-foreground shadow-[0_1px_2px_rgb(16_24_40/0.04)] dark:shadow-none';

// ─── Money parts / totals ───

/** ₹4,50,000 + "50" (paise, null when .00) for the hero number. */
export function splitMoney(n: number): { neg: boolean; rupees: string; paise: string | null } {
  const abs = Math.abs(n);
  const [whole, frac] = abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split('.');
  return { neg: n < 0, rupees: `₹${whole}`, paise: frac && frac !== '00' ? frac : null };
}

export function txnTotals(txns: AssetTxn[]): { in: number; out: number; nIn: number; nOut: number } {
  const r = { in: 0, out: 0, nIn: 0, nOut: 0 };
  for (const t of txns) {
    if (t.type === 'CREDIT') { r.in += t.amount; r.nIn++; } else { r.out += t.amount; r.nOut++; }
  }
  return r;
}

export const monthKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
export const monthHeading = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

/** 'Today' / 'Yesterday' / '12 days ago' (calendar days). */
export function relativeDayLabel(iso: string): string {
  const start = (t: Date) => new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
  const days = Math.round((start(new Date()) - start(new Date(iso))) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 60) return `${days} days ago`;
  const months = Math.round(days / 30.4);
  return months < 24 ? `${months} months ago` : `${Math.floor(days / 365)} yrs ago`;
}

/** Last 4 digits of an account reference, or null when none were shared. */
export function last4(ref: string | null | undefined): string | null {
  const digits = (ref ?? '').replace(/[^0-9]/g, '');
  return digits.length ? digits.slice(-4) : null;
}

// ─── Brand surface: darken a bank colour until white text reaches 7:1 ───

function parseColor(c: string): [number, number, number] | null {
  const hex = c.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map(i => parseInt(hex[1].slice(i, i + 2), 16)) as [number, number, number];
  const hsl = c.trim().match(/^hsl\(\s*([\d.]+)\s*,?\s*([\d.]+)%\s*,?\s*([\d.]+)%\s*\)$/i);
  if (!hsl) return null;
  const h = +hsl[1] / 360, s = +hsl[2] / 100, l = +hsl[3] / 100;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const ch = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [ch(h + 1 / 3), ch(h), ch(h - 1 / 3)].map(v => Math.round(v * 255)) as [number, number, number];
}

const luminance = ([r, g, b]: number[]) => {
  const lin = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

export function brandSurface(color: string): string {
  let rgb = parseColor(color) ?? [63, 63, 70];
  for (let i = 0; i < 20 && 1.05 / (luminance(rgb) + 0.05) < 7; i++) {
    rgb = rgb.map(v => Math.round(v * 0.92)) as [number, number, number];
  }
  return `#${rgb.map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

/** YYYY-MM-DD of the local calendar day (IST for our users), never the UTC day toISOString() gives. */
export function localDayKey(v: string | Date): string {
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = typeof v === 'string' ? new Date(v) : v;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * monthKey of the oldest shared month when it is probably cut off part-way: always when the list hit
 * the 200 cap, otherwise when the oldest entry falls after the month's first 3 days (AA consent ranges
 * start on whatever date the user picked).
 */
export function partialOldestMonth(txns: AssetTxn[], capped: boolean): string | null {
  if (!txns.length) return null;
  const oldest = txns.reduce((a, b) => (a.date < b.date ? a : b)).date;
  return capped || new Date(oldest).getDate() > 3 ? monthKey(oldest) : null;
}

/** '25 days' up to 90 days; '9 yrs 10 mo' / '4 mo' beyond. */
export function durationLabel(days: number): string {
  if (days <= 90) return `${days.toLocaleString('en-IN')} day${days === 1 ? '' : 's'}`;
  const months = Math.floor(days / 30.44);
  const y = Math.floor(months / 12), m = months % 12;
  return [y ? `${y} yr${y === 1 ? '' : 's'}` : null, m ? `${m} mo` : null].filter(Boolean).join(' ');
}

/** Rupees without '.00' paise; keeps paise when there are some (matches the hero number). */
export const inrAuto = (n: number) => inr(n, Math.round(Math.abs(n) * 100) % 100 ? 2 : 0);

/** What to call this account in copy: 'policy', 'folio', 'account'. */
export const accountNoun = (fiType: string) =>
  fiType === 'INSURANCE_POLICIES' ? 'policy' : fiType === 'MUTUAL_FUND' ? 'folio' : 'account';
