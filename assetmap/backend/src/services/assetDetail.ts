import { pool } from '../db/connection';
import { decryptPII } from '../utils/encryption';

// ─────────────────────────────────────────────
// Asset detail — everything the account page shows for one AA-linked asset.
// Only whitelisted, display-safe fields leave this module: the raw FI payload
// (holder names, PAN, addresses, full account numbers) is never returned.
// ─────────────────────────────────────────────

type Dict = Record<string, any>;

export interface AssetDetail {
  asset: {
    id: string;
    fiType: string;
    institutionName: string;
    accountRef: string;
    balance: number;
    currency: string;
    fetchedAt: string;
  };
  details: Record<string, string | number | null>;
  holdings: { name: string; units: number | null; nav: number | null; value: number | null }[];
  nominee: { status: 'registered' | 'missing' | 'in_progress' | 'unknown'; lastCheckedAt: string | null };
  history: { date: string; balance: number }[];
  transactions: {
    id: string; date: string; narration: string; type: 'CREDIT' | 'DEBIT'; amount: number;
    balanceAfter: number | null; mode: string | null; reference: string | null; category: string | null;
  }[];
}

function safeDecrypt(value: string | null | undefined): string | null {
  if (!value) return null;
  try { return decryptPII(value); } catch { return null; }
}

/** Show only the last 4 digits of any account/policy/folio reference. */
export function maskRef(ref: string | null | undefined): string {
  if (!ref) return '—';
  const digits = ref.replace(/[^0-9]/g, '');
  if (digits.length <= 4) return ref;          // already masked upstream (e.g. XXXX1234)
  return `••••${digits.slice(-4)}`;
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : typeof v === 'number' ? String(v) : null);
const first = (...vals: unknown[]) => vals.find(v => v !== undefined && v !== null && v !== '');

// ReBIT payloads arrive in a few envelopes: flat, { account: {...} } or { data: { account: {...} } }
function unwrap(raw: Dict): { root: Dict; summary: Dict; profile: Dict; txns: Dict[]; holdings: Dict[] } {
  const account: Dict = raw?.data?.account ?? raw?.account ?? raw ?? {};
  const summary: Dict = account.summary ?? raw.summary ?? {};
  const profile: Dict = account.profile ?? raw.profile ?? {};
  const txList = account.transactions?.transaction ?? raw.transactions?.transaction ?? account.transactions ?? [];
  const holdList = summary.investment?.holdings?.holding ?? account.holdings?.holding ?? summary.holdings ?? [];
  return {
    root: { ...raw, ...account },
    summary,
    profile,
    txns: Array.isArray(txList) ? txList : [],
    holdings: Array.isArray(holdList) ? holdList : [],
  };
}

function extractDetails(fiType: string, raw: Dict) {
  const { root, summary, profile, holdings } = unwrap(raw);
  const pick = (...keys: string[]) => first(...keys.flatMap(k => [summary[k], root[k]]));
  const d: Record<string, string | number | null> = {
    accountType: str(pick('type', 'accountType', 'depositType', 'policyType', 'holdingType')),
    status:      str(pick('status', 'accountStatus', 'policyStatus')),
    openedOn:    str(pick('openingDate', 'openedOn', 'policyStartDate', 'startDate')),
  };

  if (fiType === 'DEPOSIT') {
    Object.assign(d, {
      ifsc:           str(pick('ifscCode', 'ifsc')),
      branch:         str(pick('branch')),
      principal:      num(pick('principalAmount', 'principal')),
      interestRate:   num(pick('interestRate', 'rateOfInterest')),
      maturityDate:   str(pick('maturityDate')),
      maturityAmount: num(pick('maturityAmount')),
      tenureMonths:   num(pick('tenureMonths')) ?? (num(pick('tenureDays')) !== null ? Math.round(num(pick('tenureDays'))! / 30) : null),
    });
  }

  if (fiType === 'MUTUAL_FUND' || fiType === 'EQUITY' || fiType === 'NPS') {
    const invested = num(pick('costValue', 'investmentValue', 'investedValue', 'totalInvested'))
      ?? (holdings.length ? holdings.reduce((s, h) => s + (num(h.costValue ?? h.investedValue) ?? 0), 0) || null : null);
    Object.assign(d, {
      investedValue: invested,
      holdingsCount: holdings.length || num(pick('holdings', 'folios', 'holdingsCount')),
      tier:          str(pick('tier', 'tierType')),
    });
  }

  if (fiType === 'INSURANCE_POLICIES') {
    Object.assign(d, {
      planName:         str(pick('policyName', 'planName')),
      sumAssured:       num(pick('sumAssured', 'coverAmount')),
      premium:          num(pick('premiumAmount', 'premium')),
      premiumFrequency: str(pick('premiumFrequency', 'premiumPaymentFrequency')),
      maturityDate:     str(pick('maturityDate', 'policyEndDate', 'expiryDate')),
      nextPremiumDue:   str(pick('nextPremiumDueDate', 'premiumDueDate', 'renewalDate')),
    });
  }

  // ReBIT profile.holders.holder[].nominee is "REGISTERED" / "NOT-REGISTERED"
  const holder = Array.isArray(profile.holders?.holder) ? profile.holders.holder[0] : profile.holders?.holder;
  const nomineeFlag = str(holder?.nominee ?? root.nomineeStatus);

  const holdingRows = holdings.slice(0, 50).map(h => ({
    name:  str(first(h.schemeName, h.issuerName, h.name, h.symbol, h.isin)) ?? 'Holding',
    units: num(first(h.closingUnits, h.units, h.quantity)),
    nav:   num(first(h.nav, h.lastTradedPrice, h.rate)),
    value: num(first(h.currentValue, h.marketValue, h.value)),
  }));

  return { details: d, holdings: holdingRows, nomineeFlag };
}

function extractRawTransactions(raw: Dict): AssetDetail['transactions'] {
  return unwrap(raw).txns.slice(0, 200).flatMap((t, i) => {
    const amount = num(t.amount);
    const date = str(first(t.transactionTimestamp, t.valueDate, t.date));
    if (amount === null || !date) return [];
    const type = String(t.type ?? '').toUpperCase() === 'CREDIT' ? 'CREDIT' : 'DEBIT';
    return [{
      id: str(t.txnId) ?? `raw-${i}`,
      date,
      narration: str(t.narration) ?? str(t.mode) ?? 'Transaction',
      type,
      amount: Math.abs(amount),
      balanceAfter: num(t.currentBalance ?? t.balance),
      mode: str(t.mode),
      reference: str(first(t.reference, t.txnId)),
      category: null,
    } as const];
  });
}

const NOMINEE_DONE = new Set(['verified']);
const NOMINEE_INACTIVE = new Set(['failed', 'skipped']);

export async function getAssetDetail(userId: string, assetId: string): Promise<AssetDetail | null> {
  const res = await pool.query(
    `SELECT id, fi_type, institution_name, account_ref_encrypted, balance_encrypted,
            raw_json_encrypted, currency, fetched_at
       FROM asset_snapshots_aa WHERE id = $1 AND user_id = $2`,
    [assetId, userId]
  );
  const row = res.rows[0];
  if (!row) return null;

  const accountRef = safeDecrypt(row.account_ref_encrypted) ?? '';
  const balance = num(safeDecrypt(row.balance_encrypted)) ?? 0;
  let raw: Dict = {};
  try { raw = JSON.parse(safeDecrypt(row.raw_json_encrypted) ?? '{}') ?? {}; } catch { raw = {}; }

  const { details, holdings, nomineeFlag } = extractDetails(row.fi_type, raw);
  if (details.investedValue !== undefined) {
    const invested = details.investedValue as number | null;
    details.currentValue = balance;
    details.gainLoss = invested ? Math.round((balance - invested) * 100) / 100 : null;
    details.gainLossPct = invested ? Math.round(((balance - invested) / invested) * 10000) / 100 : null;
  }

  // Value history: this same account across earlier AA fetches (one point per sync)
  const siblings = await pool.query(
    `SELECT account_ref_encrypted, balance_encrypted, fetched_at
       FROM asset_snapshots_aa
      WHERE user_id = $1 AND fi_type = $2 AND institution_name = $3
      ORDER BY fetched_at ASC`,
    [userId, row.fi_type, row.institution_name]
  );
  const byDay = new Map<string, number>();
  for (const s of siblings.rows) {
    if (safeDecrypt(s.account_ref_encrypted) !== accountRef) continue;
    const value = num(safeDecrypt(s.balance_encrypted));
    if (value !== null) byDay.set(new Date(s.fetched_at).toISOString().slice(0, 10), value);
  }
  const history = [...byDay.entries()].map(([date, b]) => ({ date, balance: b }));

  // Transactions: stored rows first, else the ones carried in the FI payload
  const txRes = await pool.query(
    `SELECT id, date, narration, type, amount, balance_after, reference, category, txn_id
       FROM transactions WHERE account_id = $1 AND user_id = $2
      ORDER BY date DESC LIMIT 200`,
    [assetId, userId]
  );
  const transactions: AssetDetail['transactions'] = txRes.rows.length
    ? txRes.rows.map(t => ({
        id: t.id,
        date: new Date(t.date).toISOString(),
        narration: t.narration || 'Transaction',
        type: String(t.type).toUpperCase() === 'CREDIT' ? 'CREDIT' : 'DEBIT',
        amount: Math.abs(parseFloat(t.amount)),
        balanceAfter: t.balance_after !== null ? parseFloat(t.balance_after) : null,
        mode: null,
        reference: t.reference || t.txn_id || null,
        category: t.category || null,
      }))
    : extractRawTransactions(raw).sort((a, b) => b.date.localeCompare(a.date));

  // Nominee: an open update task wins over the last AA check
  let nominee: AssetDetail['nominee'] = { status: 'unknown', lastCheckedAt: null };
  const ns = await pool.query(
    `SELECT has_nominee, last_checked_at FROM nominee_status WHERE user_id = $1 AND account_ref = $2`,
    [userId, accountRef]
  );
  if (ns.rows[0]) {
    nominee = { status: ns.rows[0].has_nominee ? 'registered' : 'missing', lastCheckedAt: ns.rows[0].last_checked_at };
  } else if (nomineeFlag) {
    nominee = { status: /^REGISTERED$/i.test(nomineeFlag) ? 'registered' : 'missing', lastCheckedAt: row.fetched_at };
  }
  if (nominee.status !== 'registered') {
    const tasks = await pool.query(
      `SELECT status, account_ref_enc FROM nominee_update_tasks
        WHERE user_id = $1 AND institution_name = $2 ORDER BY created_at DESC LIMIT 20`,
      [userId, row.institution_name]
    );
    const task = tasks.rows.find(t => safeDecrypt(t.account_ref_enc) === accountRef);
    if (task && NOMINEE_DONE.has(task.status)) nominee.status = 'registered';
    else if (task && !NOMINEE_INACTIVE.has(task.status)) nominee.status = 'in_progress';
  }

  return {
    asset: {
      id: row.id,
      fiType: row.fi_type,
      institutionName: row.institution_name,
      accountRef: maskRef(accountRef),
      balance,
      currency: row.currency || 'INR',
      fetchedAt: row.fetched_at,
    },
    details,
    holdings,
    nominee,
    history,
    transactions,
  };
}
