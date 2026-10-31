// Shared labels and helpers for the Family Vault screens

export const RELATIONSHIP_OPTIONS: { value: string; label: string }[] = [
  { value: 'spouse',      label: 'Spouse' },
  { value: 'parent',      label: 'Parent' },
  { value: 'child',       label: 'Child' },
  { value: 'sibling',     label: 'Sibling' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'grandchild',  label: 'Grandchild' },
  { value: 'other',       label: 'Other family' },
];

export const relationshipLabel = (value: string) =>
  value === 'owner' ? 'Vault owner' : (RELATIONSHIP_OPTIONS.find(r => r.value === value)?.label ?? 'Family');

export const ASSET_CLASS_LABELS: Record<string, string> = {
  BANK_ACCOUNT:     'Bank accounts',
  FIXED_DEPOSIT:    'Fixed deposits',
  MUTUAL_FUND:      'Mutual funds',
  EQUITY:           'Stocks',
  NPS:              'NPS',
  EPF:              'EPF',
  PPF:              'PPF',
  INSURANCE_LIFE:   'Life insurance',
  INSURANCE_HEALTH: 'Health insurance',
  REAL_ESTATE:      'Property',
  OTHER:            'Gold & other',
};
export const assetClassLabel = (cls: string) => ASSET_CLASS_LABELS[cls] ?? cls.replace(/_/g, ' ').toLowerCase();

export const SHARING_OPTIONS: { key: keyof SharingKeys; label: string; hint: string }[] = [
  { key: 'shareBankAccounts',  label: 'Bank accounts',     hint: 'Savings and current account balances' },
  { key: 'shareFixedDeposits', label: 'Fixed deposits',    hint: 'FD and RD values' },
  { key: 'shareMutualFunds',   label: 'Mutual funds',      hint: 'Current fund value' },
  { key: 'shareEquity',        label: 'Stocks',            hint: 'Demat holdings value' },
  { key: 'shareNps',           label: 'NPS',               hint: 'Pension corpus' },
  { key: 'shareEpf',           label: 'EPF & PPF',         hint: 'Provident fund balances' },
  { key: 'shareInsurance',     label: 'Insurance',         hint: 'Policy values' },
  { key: 'shareLand',          label: 'Property',          hint: 'Land and real-estate records' },
  { key: 'shareGold',          label: 'Gold & other',      hint: 'Off by default for privacy' },
];
export interface SharingKeys {
  shareBankAccounts: boolean; shareFixedDeposits: boolean; shareMutualFunds: boolean; shareEquity: boolean;
  shareNps: boolean; shareEpf: boolean; shareInsurance: boolean; shareLand: boolean; shareGold: boolean;
  shareTotalNetworth: boolean;
}

export const GOAL_TYPE_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: 'education',      label: 'Education',      emoji: '🎓' },
  { value: 'home_purchase',  label: 'Home purchase',  emoji: '🏠' },
  { value: 'emergency_fund', label: 'Emergency fund', emoji: '🛟' },
  { value: 'wedding',        label: 'Wedding',        emoji: '💍' },
  { value: 'vacation',       label: 'Vacation',       emoji: '✈️' },
  { value: 'retirement',     label: 'Retirement',     emoji: '🌴' },
  { value: 'vehicle',        label: 'Vehicle',        emoji: '🚗' },
  { value: 'medical',        label: 'Medical',        emoji: '🏥' },
  { value: 'other',          label: 'Other',          emoji: '🎯' },
];
export const goalTypeLabel = (value: string) => GOAL_TYPE_OPTIONS.find(g => g.value === value)?.label ?? 'Savings';

/** Full Indian-format rupees from paise, e.g. ₹12,34,567 */
export const rupees = (paise: number) => `₹${Math.round((paise || 0) / 100).toLocaleString('en-IN')}`;

/** Compact rupees for headline figures: ₹1.20Cr / ₹4.50L / ₹12,000 */
export function rupeesCompact(paise: number): string {
  const amount = (paise || 0) / 100;
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(2)}Cr`;
  if (amount >= 1_00_000)    return `₹${(amount / 1_00_000).toFixed(2)}L`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join('') || 'F';

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const selectClass =
  'w-full h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50';
export const inputClass =
  'w-full h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50';
export const cardClass = 'rounded-2xl border border-border bg-card text-card-foreground shadow-sm';
