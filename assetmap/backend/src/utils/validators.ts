import { FI_TYPES } from './constants';

// ═══════════════════════════════════════════════════════════════
// AssetMap — JSON Validation Schemas for Fastify
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// Auth Schemas
// ─────────────────────────────────────────────

export const AadhaarInitiateSchema = {
  type: 'object',
  required: ['aadhaarNumber'],
  properties: {
    aadhaarNumber: { type: 'string', minLength: 12, maxLength: 14 }
  },
  additionalProperties: false
};

export const AadhaarVerifySchema = {
  type: 'object',
  required: ['transactionId', 'otp'],
  properties: {
    transactionId: { type: 'string', format: 'uuid' },
    otp: { type: 'string', pattern: '^\\d{6}$' }
  },
  additionalProperties: false
};

export const PhoneInitiateSchema = {
  type: 'object',
  required: ['countryCode', 'phoneNumber'],
  properties: {
    countryCode: { type: 'string', pattern: '^\\+\\d{1,4}$' },
    phoneNumber: { type: 'string', pattern: '^\\d{4,15}$' },
    channel: { type: 'string', enum: ['sms', 'whatsapp'] }
  },
  additionalProperties: false
};

export const PhoneVerifySchema = {
  type: 'object',
  required: ['transactionId', 'otp'],
  properties: {
    transactionId: { type: 'string' },
    otp: { type: 'string', pattern: '^\\d{6}$' }
  },
  additionalProperties: false
};

export const RefreshTokenSchema = {
  type: 'object',
  properties: {
    refreshToken: { type: 'string' }
  },
  additionalProperties: false
};

// ─────────────────────────────────────────────
// Consent Schemas
// ─────────────────────────────────────────────

export const ConsentCreateSchema = {
  type: 'object',
  required: ['fiTypes', 'purpose', 'dateRangeStart', 'dateRangeEnd'],
  properties: {
    fiTypes: {
      type: 'array',
      items: { type: 'string', enum: [...FI_TYPES] },
      minItems: 1
    },
    purpose: { type: 'string', minLength: 10, maxLength: 500 },
    dateRangeStart: { type: 'string', format: 'date' },
    dateRangeEnd: { type: 'string', format: 'date' }
  },
  additionalProperties: false
};

export const ConsentCallbackSchema = {
  type: 'object',
  required: ['consentId'],
  properties: {
    consentId: { type: 'string', minLength: 1 },
    // Setu sends 'consentStatus', but we also accept 'status' for compatibility
    status: { type: 'string', enum: ['ACTIVE', 'REVOKED', 'EXPIRED', 'PENDING', 'APPROVED', 'REJECTED'] },
    consentStatus: { type: 'string', enum: ['ACTIVE', 'REVOKED', 'EXPIRED', 'PENDING', 'APPROVED', 'REJECTED'] },
    consentHandle: { type: 'string' },
    type: { type: 'string' },
    timestamp: { type: 'string' }
  },
  additionalProperties: true
};

// ─────────────────────────────────────────────
// Land Search Schemas
// ─────────────────────────────────────────────

export const LandSearchByNameSchema = {
  type: 'object',
  required: ['name', 'state', 'district'],
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 200 },
    state: { type: 'string', minLength: 2, maxLength: 100 },
    district: { type: 'string', minLength: 2, maxLength: 100 }
  },
  additionalProperties: false
};

export const LandSearchByPANSchema = {
  type: 'object',
  required: ['pan', 'state'],
  properties: {
    pan: { type: 'string', pattern: '^[A-Z]{5}\\d{4}[A-Z]$' },
    state: { type: 'string', minLength: 2, maxLength: 100 }
  },
  additionalProperties: false
};

// ─────────────────────────────────────────────
// Estate Schemas
// ─────────────────────────────────────────────

export const EstateFileSchema = {
  type: 'object',
  required: ['deceasedName', 'deceasedAadhaar', 'relationship'],
  properties: {
    deceasedName: { type: 'string', minLength: 2, maxLength: 200 },
    deceasedAadhaar: { type: 'string', minLength: 12, maxLength: 14 },
    relationship: { type: 'string', minLength: 2, maxLength: 100 }
  },
  additionalProperties: false
};

// ─────────────────────────────────────────────
// Report Schemas
// ─────────────────────────────────────────────

export const ReportGenerateSchema = {
  type: 'object',
  properties: {
    includeCategories: {
      type: 'array',
      items: { type: 'string', enum: [...FI_TYPES] }
    },
    includeLandRecords: { type: 'boolean' }
  },
  additionalProperties: false
};

// ─────────────────────────────────────────────
// User Schemas
// ─────────────────────────────────────────────

export const UserDeleteSchema = {
  type: 'object',
  required: ['confirmPhrase'],
  properties: {
    confirmPhrase: { type: 'string', const: 'DELETE MY DATA' }
  },
  additionalProperties: false
};

// ─────────────────────────────────────────────
// Pagination Schema
// ─────────────────────────────────────────────

export const PaginationQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'string' },
    limit: { type: 'string' }
  },
  additionalProperties: false
};

// ─────────────────────────────────────────────
// Will Schemas
// ─────────────────────────────────────────────

// Testator Aadhaar is never collected here: the user is already Aadhaar-verified and the
// server attaches the stored salted hash. Plan/subscription come from the server too.
const WILL_DETAILS_PROPERTIES = {
  testatorName:     { type: 'string', minLength: 2, maxLength: 200 },
  testatorDob:      { type: 'string', pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' },
  testatorAddress:  { type: 'string', minLength: 5, maxLength: 500 },
  testatorPan:      { type: 'string', pattern: '^([A-Z]{5}[0-9]{4}[A-Z])?$' },
  executorName:     { type: 'string', minLength: 2, maxLength: 200 },
  executorRelation: { type: 'string', minLength: 2, maxLength: 50 },
  executorMobile:   { type: 'string', pattern: '^[6-9][0-9]{9}$' },
  altExecutorName:  { type: 'string', maxLength: 200 },
};

export const WillCreateSchema = {
  type: 'object',
  required: ['testatorName', 'testatorDob', 'testatorAddress', 'executorName', 'executorRelation', 'executorMobile'],
  properties: WILL_DETAILS_PROPERTIES,
  additionalProperties: false
};

export const WillUpdateSchema = WillCreateSchema;

export const WillBeneficiarySchema = {
  type: 'object',
  required: ['name', 'relation'],
  properties: {
    name:     { type: 'string', minLength: 2, maxLength: 200 },
    relation: { type: 'string', minLength: 2, maxLength: 50 },
    dob:      { type: 'string', pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' },
    mobile:   { type: 'string', pattern: '^[6-9][0-9]{9}$' },
    email:    { type: 'string', maxLength: 200 },
    address:  { type: 'string', maxLength: 500 },
  },
  additionalProperties: false
};

// Must match the will_allocations.asset_type CHECK constraint (006_phase2_features.sql)
export const WILL_ASSET_TYPES = [
  'bank_account', 'mutual_fund', 'equity', 'insurance_policy',
  'land_record', 'nps', 'vehicle', 'jewelry', 'other',
] as const;

export const WillAllocationSchema = {
  type: 'object',
  required: ['assetType', 'assetDescription', 'beneficiaryId', 'allocationPct'],
  properties: {
    assetType:           { type: 'string', enum: WILL_ASSET_TYPES },
    assetRefId:          { type: 'string', format: 'uuid' },
    assetDescription:    { type: 'string', minLength: 2, maxLength: 300 },
    estimatedValuePaise: { type: 'number', minimum: 0 },
    beneficiaryId:       { type: 'string', format: 'uuid' },
    allocationPct:       { type: 'number', exclusiveMinimum: 0, maximum: 100 },
    conditionText:       { type: 'string', maxLength: 500 },
    notes:               { type: 'string', maxLength: 500 }
  },
  additionalProperties: false
};

// ─────────────────────────────────────────────
// Recovery Schemas
// ─────────────────────────────────────────────

export const RecoveryCaseSchema = {
  type: 'object',
  required: ['recoveryType', 'assetDescription', 'estimatedValuePaise'],
  properties: {
    recoveryType: { type: 'string', enum: ['iepf_shares', 'iepf_dividend', 'epf_balance', 'epf_pension', 'mutual_fund', 'dormant_bank', 'insurance_maturity', 'ppf_balance'] },
    assetDescription: { type: 'string', minLength: 5, maxLength: 500 },
    estimatedValuePaise: { type: 'number' },
    institutionName: { type: 'string' },
    uanNumber: { type: 'string' },
    accountNumber: { type: 'string' },
    folioNumber: { type: 'string' },
    policyNumber: { type: 'string' },
    isin: { type: 'string' }
  },
  additionalProperties: false
};

export const RecoveryDocumentSchema = {
  type: 'object',
  required: ['docType', 'docLabel', 'fileName'],
  properties: {
    docType: { type: 'string' },
    docLabel: { type: 'string' },
    fileName: { type: 'string' }
  },
  additionalProperties: false
};

// ─────────────────────────────────────────────
// Unclaimed Schemas
// ─────────────────────────────────────────────

export const UnclaimedSearchSchema = {
  type: 'object',
  required: ['firstName', 'lastName'],
  properties: {
    firstName: { type: 'string', minLength: 2 },
    lastName: { type: 'string', minLength: 2 },
    dob: { type: 'string' },
    pan: { type: 'string' },
    address: { type: 'string' }
  },
  additionalProperties: false
};

// ─────────────────────────────────────────────
// Loan Schemas
// ─────────────────────────────────────────────

export const LoanAssessSchema = {
  type: 'object',
  required: [
    'monthlyIncomePaise',
    'monthlyObligationsPaise',
    'totalAssetsPaise',
    'totalLandValuePaise',
    'existingLoansPaise',
    'creditScoreApprox'
  ],
  properties: {
    monthlyIncomePaise: { type: 'number' },
    monthlyObligationsPaise: { type: 'number' },
    totalAssetsPaise: { type: 'number' },
    totalLandValuePaise: { type: 'number' },
    existingLoansPaise: { type: 'number' },
    creditScoreApprox: { type: 'number' }
  },
  additionalProperties: false
};

// ─────────────────────────────────────────────
// Insurance Schemas
// ─────────────────────────────────────────────

export const InsuranceAnalyzeSchema = {
  type: 'object',
  required: ['profile'],
  properties: {
    profile: {
      type: 'object',
      required: ['annualIncomePaise', 'age', 'dependentsCount', 'outstandingLoansPaise', 'monthlyExpensesPaise'],
      properties: {
        annualIncomePaise: { type: 'integer', minimum: 0, maximum: 100000000000 },
        age: { type: 'integer', minimum: 1, maximum: 120 },
        dependentsCount: { type: 'integer', minimum: 0, maximum: 50 },
        outstandingLoansPaise: { type: 'integer', minimum: 0 },
        monthlyExpensesPaise: { type: 'integer', minimum: 0 }
      },
      additionalProperties: false
    }
  },
  additionalProperties: false
};

// ─────────────────────────────────────────────
// Logs Schemas
// ─────────────────────────────────────────────

export const FrontendLogSchema = {
  type: 'object',
  required: ['message', 'type'],
  properties: {
    message: { type: 'string', maxLength: 1000 },
    type: { type: 'string', maxLength: 100 },
    stack: { type: 'string', maxLength: 5000 },
    url: { type: 'string', maxLength: 500 },
    timestamp: { type: 'string', format: 'date-time' },
    userAgent: { type: 'string', maxLength: 300 }
  },
  additionalProperties: false
};

export const RegisterPanSchema = {
  type: 'object',
  required: ['registrationToken', 'panNumber', 'panName', 'dob'],
  properties: {
    registrationToken: { type: 'string' },
    panNumber: { type: 'string', pattern: '^[A-Z]{5}\\d{4}[A-Z]$' },
    panName: { type: 'string', minLength: 2 },
    dob: { type: 'string', minLength: 1 }
  },
  additionalProperties: false
};

export const RegisterAadhaarInitiateSchema = {
  type: 'object',
  required: ['registrationToken', 'aadhaarNumber'],
  properties: {
    registrationToken: { type: 'string' },
    aadhaarNumber: { type: 'string', minLength: 12, maxLength: 14 }
  },
  additionalProperties: false
};

export const RegisterAadhaarVerifySchema = {
  type: 'object',
  required: ['registrationToken', 'referenceId', 'otp'],
  properties: {
    registrationToken: { type: 'string' },
    referenceId: { type: 'string' },
    otp: { type: 'string', pattern: '^\\d{6}$' }
  },
  additionalProperties: false
};

export const EmailInitiateSchema = {
  type: 'object',
  required: ['registrationToken', 'email'],
  properties: {
    registrationToken: { type: 'string' },
    email: { type: 'string', format: 'email' }
  },
  additionalProperties: false
};

export const EmailVerifySchema = {
  type: 'object',
  required: ['registrationToken', 'otp'],
  properties: {
    registrationToken: { type: 'string' },
    otp: { type: 'string', pattern: '^\\d{6}$' }
  },
  additionalProperties: false
};

export const RegisterConfirmSchema = {
  type: 'object',
  required: ['registrationToken'],
  properties: {
    registrationToken: { type: 'string' }
  },
  additionalProperties: false
};

export const FcmTokenSchema = {
  type: 'object',
  required: ['token'],
  properties: {
    token: { type: 'string', maxLength: 1000 }
  },
  additionalProperties: false
};

export const AlertsPreferencesSchema = {
  type: 'object',
  properties: {
    email: { type: 'boolean' },
    sms: { type: 'boolean' },
    push: { type: 'boolean' }
  },
  additionalProperties: true
};

export const RecoveryLegacyRequestSchema = {
  type: 'object',
  required: ['unclaimedAssetId'],
  properties: {
    unclaimedAssetId: { type: 'string' },
    assetDescription: { type: 'string', maxLength: 500 },
    institutionName: { type: 'string' },
    estimatedValue: { type: 'number' }
  },
  additionalProperties: false
};

