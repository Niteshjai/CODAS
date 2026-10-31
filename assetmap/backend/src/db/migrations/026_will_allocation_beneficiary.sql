-- Will allocations only stored the (encrypted) beneficiary name, so removing a beneficiary
-- left orphaned allocations and the PDF had to match people by name. Link them by id;
-- deleting a beneficiary now removes their allocations too.
ALTER TABLE will_allocations
  ADD COLUMN IF NOT EXISTS beneficiary_id UUID REFERENCES will_beneficiaries(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_will_allocations_beneficiary ON will_allocations(beneficiary_id);

-- Raw Aadhaar numbers were written into these "hash" columns by the old builder.
-- The testator's verified hash now comes from users.aadhaar_hash and beneficiaries'
-- Aadhaar is no longer collected; clear any plaintext values already stored.
UPDATE wills SET testator_aadhaar_hash = NULL WHERE testator_aadhaar_hash ~ '^[0-9]{12}$';
UPDATE will_beneficiaries SET aadhaar_hash = NULL WHERE aadhaar_hash ~ '^[0-9]{12}$';
UPDATE will_allocations SET beneficiary_aadhaar_hash = NULL WHERE beneficiary_aadhaar_hash ~ '^[0-9]{12}$';
