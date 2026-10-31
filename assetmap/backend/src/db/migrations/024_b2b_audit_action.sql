-- B2B gateway audit entries (b2b_gateway/src/b2b/gateway.ts) were silently dropped:
-- 'B2B_DATA_ACCESSED' was missing from the audit_action enum.
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'B2B_DATA_ACCESSED';
