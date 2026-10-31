-- ─────────────────────────────────────────────────────
-- FAMILY VAULT: multi-user fixes
--  * invited mobile numbers are no longer stored in plaintext: a salted hash
--    (for matching the invitee's account) plus an AES-GCM copy (for re-sending the SMS)
--  * a user can be an active member of only one vault at a time
--  * the owner's member row no longer carries the literal display name 'Me'
--    (other members saw the owner as "Me"); names now resolve from the account
--  * activity types and audit actions used by the family flows
-- ─────────────────────────────────────────────────────

ALTER TABLE family_vault_members
  ADD COLUMN IF NOT EXISTS invited_mobile_hash      VARCHAR(128),
  ADD COLUMN IF NOT EXISTS invited_mobile_encrypted TEXT;

CREATE INDEX IF NOT EXISTS idx_family_members_invited_hash
  ON family_vault_members(invited_mobile_hash)
  WHERE status = 'invited';

-- Plaintext numbers are only needed while an invite is still pending (legacy rows);
-- accepted, declined and removed rows drop them
UPDATE family_vault_members
   SET invited_mobile = NULL
 WHERE status <> 'invited' AND invited_mobile IS NOT NULL;

-- Owner rows created with the placeholder name 'Me'
UPDATE family_vault_members fvm
   SET display_name = NULL
  FROM family_vaults fv
 WHERE fv.id = fvm.vault_id
   AND fvm.user_id = fv.primary_user_id
   AND fvm.display_name = 'Me';

-- Duplicate active owner rows (createVault used ON CONFLICT DO NOTHING without a unique key)
DELETE FROM family_vault_members a
 USING family_vault_members b
 WHERE a.user_id IS NOT NULL
   AND a.user_id = b.user_id
   AND a.vault_id = b.vault_id
   AND a.status = 'active' AND b.status = 'active'
   AND a.created_at > b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS uq_family_members_one_active_vault
  ON family_vault_members(user_id)
  WHERE status = 'active' AND user_id IS NOT NULL;

ALTER TABLE family_activity_feed
  DROP CONSTRAINT IF EXISTS family_activity_feed_activity_type_check;
ALTER TABLE family_activity_feed
  ADD CONSTRAINT family_activity_feed_activity_type_check CHECK (activity_type IN (
    'member_invited',
    'member_joined',
    'member_left',
    'goal_created',
    'goal_completed',
    'goal_cancelled',
    'goal_contribution',
    'networth_milestone',
    'nominee_added',
    'will_created',
    'large_asset_added'
  ));

ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'FAMILY_VAULT_CREATED';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'FAMILY_VAULT_CLOSED';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'FAMILY_MEMBER_INVITED';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'FAMILY_MEMBER_JOINED';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'FAMILY_MEMBER_REMOVED';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'FAMILY_MEMBER_LEFT';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'FAMILY_SHARING_UPDATED';

-- Audit actions the code already writes but the enum never had: those inserts were
-- failing silently (auditLogger swallows errors), leaving gaps in the audit trail
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'AFFILIATE_CLICK';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'LAND_DATA_FETCHED';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'LAND_RECORD_VIEWED';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'UNCLAIMED_SEARCH_COMPLETED';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'CREATE_RECORD';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'UPDATE_RECORD';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'UPLOAD_DOCUMENT';
