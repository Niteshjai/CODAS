-- upsertLandRecord (src/db/queries/landRecords.ts) uses
-- ON CONFLICT (user_id, source, source_record_id), which Postgres only accepts when a
-- matching unique index exists. 004_land_records.sql never created one, so every land
-- fetch and nightly re-sync failed with "no unique or exclusion constraint matching".
-- NULL source_record_id values stay distinct, so legacy rows without an id are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS uq_land_records_user_source_record
  ON land_records (user_id, source, source_record_id);
