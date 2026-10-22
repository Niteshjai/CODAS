-- Align databases created by the original 019 migration with the 2FA services.

DO $$
BEGIN
  IF to_regclass('public.backup_codes') IS NOT NULL
     AND to_regclass('public.two_factor_backup_codes') IS NULL THEN
    ALTER TABLE backup_codes RENAME TO two_factor_backup_codes;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS two_factor_backup_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  used_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE trusted_devices
  ADD COLUMN IF NOT EXISTS device_type TEXT,
  ADD COLUMN IF NOT EXISTS browser TEXT,
  ADD COLUMN IF NOT EXISTS os TEXT,
  ADD COLUMN IF NOT EXISTS trusted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE two_factor_backup_codes
  ADD COLUMN IF NOT EXISTS used_ip TEXT;

CREATE INDEX IF NOT EXISTS idx_two_factor_backup_codes_user
  ON two_factor_backup_codes(user_id);
