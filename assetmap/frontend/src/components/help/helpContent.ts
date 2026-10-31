// Help-centre content. Written against the app's real flows — keep it in sync when a feature changes.

export interface Guide {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  category: GuideCategory;
  steps: string[];
  tips?: string[];
  cta?: { label: string; to: string };
}

export type GuideCategory = 'Getting started' | 'Your assets' | 'Family & legacy' | 'Account & security';

export interface Faq {
  id: string;
  q: string;
  a: string;
  topic: 'Security & privacy' | 'Data & consent' | 'Features' | 'Plans & billing';
}

export const GUIDES: Guide[] = [
  {
    id: 'sign-in',
    title: 'Sign in and verify your identity',
    summary: 'Create your account with your mobile number and a one-time Aadhaar verification.',
    minutes: 3,
    category: 'Getting started',
    steps: [
      'On the sign-in screen, choose your country code and enter your mobile number, then tap Continue.',
      'Enter the 6-digit OTP sent to your phone. Returning users go straight to their dashboard (or the two-factor check if it is switched on).',
      'New users enter their PAN, then their Aadhaar number. UIDAI sends an OTP to the mobile linked with Aadhaar — enter it to verify.',
      'Check the identity details fetched from Aadhaar (name, date of birth) and confirm them.',
      'Add your email address and verify it with the code we send. You can now link your accounts.',
    ],
    tips: [
      'Your Aadhaar number is never stored — only a salted one-way hash is kept to prevent duplicate accounts.',
      'Didn\'t get the OTP? Wait for the timer and tap Resend, or check that the number is correct.',
    ],
  },
  {
    id: 'link-accounts',
    title: 'Link your bank and investment accounts',
    summary: 'Give consent through the RBI Account Aggregator framework to fetch your financial data read-only.',
    minutes: 4,
    category: 'Getting started',
    steps: [
      'Open the consent screen (you are taken there after sign-up, or use the link below).',
      'Choose the data you want to share — bank accounts, deposits, mutual funds, equities, NPS, EPF, insurance — and continue.',
      'You are redirected to the Account Aggregator (Setu). Verify with the OTP and select the accounts to link.',
      'Approve the consent. You return to the app automatically and your assets start appearing on the dashboard.',
    ],
    tips: [
      'Access is read-only: nobody can move money through this connection.',
      'You can revoke consent at any time from your Account Aggregator app; new data stops flowing immediately.',
    ],
    cta: { label: 'Open consent', to: '/consent' },
  },
  {
    id: 'asset-discovery',
    title: 'Find and understand your assets',
    summary: 'See everything you own in one place and drill into each account.',
    minutes: 2,
    category: 'Your assets',
    steps: [
      'Open the Dashboard. Overview shows your net worth and how it is split across asset types.',
      'Open Asset Discovery to see every linked account, deposit, fund and policy.',
      'Select any asset to see its details — balance or value, nominee status and when it last synced.',
      'Use "Add asset" for anything not covered by the Account Aggregator (for example cash or gold) so your net worth is complete.',
    ],
    cta: { label: 'Open Asset Discovery', to: '/dashboard?tab=discovery' },
  },
  {
    id: 'property',
    title: 'View your land and property records',
    summary: 'Fetch land records linked to your identity and track their details.',
    minutes: 3,
    category: 'Your assets',
    steps: [
      'Open Dashboard → Property.',
      'If asked, allow access to land records (it is part of your data consent).',
      'Your parcels appear on the map and in the list — survey/khasra number, village, district and area.',
      'Select a parcel to see its details, ownership information and documents where the state registry provides them.',
    ],
    tips: ['Land registries update on their own schedule; records are re-checked automatically every night.'],
    cta: { label: 'Open Property', to: '/dashboard?tab=land' },
  },
  {
    id: 'unclaimed',
    title: 'Search for unclaimed money',
    summary: 'Look for dormant deposits, unclaimed dividends and forgotten policies.',
    minutes: 2,
    category: 'Your assets',
    steps: [
      'Open Dashboard → Unclaimed.',
      'Run a search; we check sources such as dormant bank deposits, unclaimed dividends/shares and insurance.',
      'Review any matches and follow the recovery steps shown for each one.',
    ],
    cta: { label: 'Open Unclaimed', to: '/dashboard?tab=unclaimed' },
  },
  {
    id: 'nominees',
    title: 'Check and update nominees',
    summary: 'Make sure every account has a nominee so your family can claim it.',
    minutes: 3,
    category: 'Family & legacy',
    steps: [
      'Open the nominee page. Accounts without a nominee are flagged.',
      'Select the accounts you want to fix and enter the nominee\'s details.',
      'Submit. Each update is tracked as a task with its own status; in-progress updates show until the institution confirms.',
    ],
    cta: { label: 'Open nominee check', to: '/nominee' },
  },
  {
    id: 'will',
    title: 'Create your Digital Will',
    summary: 'Write a will in four steps and download it as a PDF to sign.',
    minutes: 6,
    category: 'Family & legacy',
    steps: [
      'Open Dashboard → Digital Will.',
      'Details: your name, date of birth, address and (optionally) PAN, plus an executor and their mobile number. You must be 18 or older, and the executor can\'t be you.',
      'Beneficiaries: add each person by full legal name and relationship.',
      'Assets: choose a synced asset or describe another one, pick a beneficiary and the share. A single asset can\'t exceed 100% in total.',
      'Review the will, then Generate & download the PDF. Sign it in front of two witnesses who are not beneficiaries.',
    ],
    tips: ['Your progress is saved — you can come back and continue or edit any step later.'],
    cta: { label: 'Open Digital Will', to: '/dashboard?tab=will' },
  },
  {
    id: 'family-vault',
    title: 'Share with your family using Family Vault',
    summary: 'See your family\'s combined net worth, shared goals and estate readiness.',
    minutes: 4,
    category: 'Family & legacy',
    steps: [
      'Open Dashboard → Family Vault and create your vault (the owner needs the Pro plan; members don\'t).',
      'Tap Invite member and enter their name, relationship and mobile number. They get an SMS link that expires in 7 days.',
      'The invitee signs in with that mobile number and accepts — from the SMS link or from the invitation shown on their Family Vault page.',
      'Each member chooses what they share (bank, deposits, funds, property and more) from their sharing settings, and can change it any time.',
      'Create shared goals and record contributions; the owner can resend or cancel invites and remove members.',
    ],
    tips: ['An invite only works for the mobile number it was sent to, so a forwarded link can\'t be used by someone else.'],
    cta: { label: 'Open Family Vault', to: '/dashboard?tab=family' },
  },
  {
    id: 'two-factor',
    title: 'Turn on two-factor authentication',
    summary: 'Add an authenticator app or email code as a second step at sign-in.',
    minutes: 3,
    category: 'Account & security',
    steps: [
      'Open Settings → Two-factor authentication.',
      'Choose an authenticator app (scan the QR code) or email codes, and enter the code to confirm.',
      'Save your backup codes somewhere safe — each one works once if you lose your device.',
      'From now on, sign-in asks for the second step after your mobile OTP.',
    ],
    cta: { label: 'Open two-factor settings', to: '/settings/2fa' },
  },
  {
    id: 'plans',
    title: 'Choose a plan and manage billing',
    summary: 'Compare Free, Plus and Pro, upgrade, and see your invoices.',
    minutes: 2,
    category: 'Account & security',
    steps: [
      'Open the Pricing page to compare plans and features.',
      'Choose Upgrade and pay securely through Razorpay.',
      'See your current plan, renewal date and payment history on the Billing page.',
    ],
    tips: ['You can move up to a higher plan at any time. Switching to a lower or free plan isn\'t possible while a paid plan is active.'],
    cta: { label: 'View plans', to: '/pricing' },
  },
  {
    id: 'privacy',
    title: 'Control your data and privacy',
    summary: 'See who accessed your data, revoke consent, or ask us to delete your account.',
    minutes: 2,
    category: 'Account & security',
    steps: [
      'Every sensitive action on your account (sign-ins, consents, reports, sharing changes) is written to a tamper-proof audit log. Ask support for a copy at any time.',
      'To stop new data flowing in, revoke consent from your Account Aggregator app.',
      'To delete your account and data, open a support ticket with the topic "Privacy & data" — we confirm and process it under the DPDP Act.',
    ],
  },
];

export const FAQS: Faq[] = [
  {
    id: 'secure',
    topic: 'Security & privacy',
    q: 'Is my data secure?',
    a: 'Personal details are encrypted with AES-256-GCM, and your Aadhaar number, mobile and email are stored only as salted one-way hashes for lookup. Sessions use signed, httpOnly cookies, and you can add two-factor authentication.',
  },
  {
    id: 'aadhaar',
    topic: 'Security & privacy',
    q: 'Do you store my Aadhaar number?',
    a: 'No. Aadhaar is used once for verification through UIDAI. We keep only a salted hash so the same Aadhaar can\'t open two accounts — the number itself can\'t be recovered from it.',
  },
  {
    id: 'move-money',
    topic: 'Data & consent',
    q: 'Can the app move money from my accounts?',
    a: 'No. The Account Aggregator connection is read-only. It can fetch balances and holdings you consented to share — it cannot make payments or transfers.',
  },
  {
    id: 'revoke',
    topic: 'Data & consent',
    q: 'How do I stop sharing my financial data?',
    a: 'Revoke the consent from your Account Aggregator app. New data stops flowing immediately. To also delete what we already hold, open a support ticket with the topic "Privacy & data".',
  },
  {
    id: 'missing-account',
    topic: 'Data & consent',
    q: 'An account is missing. What should I do?',
    a: 'Make sure you selected it during Account Aggregator consent and that the bank supports the framework. You can grant consent again from the consent screen, or add the asset manually from Asset Discovery.',
  },
  {
    id: 'stale',
    topic: 'Data & consent',
    q: 'Why is a balance out of date?',
    a: 'Values refresh when the institution shares new data through the Account Aggregator. Each asset shows when it last synced; property records are re-checked nightly.',
  },
  {
    id: 'will-legal',
    topic: 'Features',
    q: 'Is the Digital Will legally valid?',
    a: 'A will in India is valid when signed by you in front of two witnesses who also sign. Download the PDF, sign it with two witnesses who are not beneficiaries, and keep it safe. Registration is optional but recommended.',
  },
  {
    id: 'family-pro',
    topic: 'Features',
    q: 'Do my family members need Pro to join my Family Vault?',
    a: 'No. Only the vault owner needs Pro. Invited members join free, and each member decides which asset types they share.',
  },
  {
    id: 'family-invite',
    topic: 'Features',
    q: 'My family member didn\'t get the invite. What now?',
    a: 'Ask them to sign in with the exact mobile number you invited — pending invitations also appear on their Family Vault page. You can resend the invite from their card; links expire after 7 days.',
  },
  {
    id: 'downgrade',
    topic: 'Plans & billing',
    q: 'Can I switch to a cheaper plan?',
    a: 'You can upgrade at any time. Moving to a lower or free plan isn\'t available while a paid plan is active.',
  },
  {
    id: 'payments',
    topic: 'Plans & billing',
    q: 'How are payments processed?',
    a: 'Payments are handled by Razorpay. We never see or store your card or UPI details. Your invoices are on the Billing page.',
  },
  {
    id: 'delete',
    topic: 'Security & privacy',
    q: 'How do I delete my account?',
    a: 'Open a support ticket with the topic "Privacy & data" and ask for deletion. We verify the request and erase your personal data, except records we must keep by law (such as audit logs).',
  },
];

export const SUPPORT_TOPICS: { value: string; label: string }[] = [
  { value: 'account', label: 'Sign-in & account' },
  { value: 'consent', label: 'Linking accounts (AA consent)' },
  { value: 'assets', label: 'Assets & net worth' },
  { value: 'property', label: 'Property records' },
  { value: 'nominee', label: 'Nominees' },
  { value: 'will', label: 'Digital Will' },
  { value: 'family', label: 'Family Vault' },
  { value: 'billing', label: 'Plans & billing' },
  { value: 'privacy', label: 'Privacy & data' },
  { value: 'bug', label: 'Something isn\'t working' },
  { value: 'other', label: 'Something else' },
];

export const topicLabel = (value: string) => SUPPORT_TOPICS.find(t => t.value === value)?.label ?? 'Other';

export const SUPPORT_EMAIL: string = import.meta.env.VITE_SUPPORT_EMAIL || 'support@assetmap.in';

/** Case-insensitive search over guide/FAQ text. Every word must match somewhere. */
export function searchHelp(query: string) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return { guides: [] as Guide[], faqs: [] as Faq[] };
  const matches = (text: string) => {
    const t = text.toLowerCase();
    return words.every(w => t.includes(w));
  };
  return {
    guides: GUIDES.filter(g => matches([g.title, g.summary, g.category, ...g.steps, ...(g.tips ?? [])].join(' '))),
    faqs: FAQS.filter(f => matches(`${f.q} ${f.a} ${f.topic}`)),
  };
}
