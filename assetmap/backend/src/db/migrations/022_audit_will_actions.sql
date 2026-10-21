-- Add will-related audit actions for databases created before estate planning.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'WILL_CREATED'
      AND enumtypid = 'audit_action'::regtype
  ) THEN
    ALTER TYPE audit_action ADD VALUE 'WILL_CREATED';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumlabel = 'WILL_PDF_GENERATED'
      AND enumtypid = 'audit_action'::regtype
  ) THEN
    ALTER TYPE audit_action ADD VALUE 'WILL_PDF_GENERATED';
  END IF;
END$$;
