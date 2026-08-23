const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Nitesh123@localhost:5432/assetmap' });

async function debugLand() {
  try {
    const users = await pool.query('SELECT id FROM users');
    console.log(`Checking ${users.rows.length} users...`);

    for (const row of users.rows) {
      const userId = row.id;
      
      // 1. Check consents
      const consents = await pool.query(
        "SELECT * FROM consents WHERE user_id = $1 AND status = 'ACTIVE' AND date_range_end >= NOW() ORDER BY created_at DESC",
        [userId]
      );
      
      const activeConsent = consents.rows[0];
      if (!activeConsent) {
        console.log(`User ${userId}: No active consent found.`);
        continue;
      }
      
      // fi_types might be returned as an array or a postgres array string
      const fiTypes = activeConsent.fi_types;
      const hasLandConsent = fiTypes && fiTypes.includes('LAND_RECORDS');
      console.log(`User ${userId}: Active consent found. fi_types:`, fiTypes, `hasLandConsent: ${hasLandConsent}`);

      if (!hasLandConsent) {
        console.log(`User ${userId}: Missing LAND_RECORDS in fi_types.`);
        continue;
      }

      // 2. Check land records
      const landRecords = await pool.query(
        "SELECT * FROM land_records WHERE user_id = $1 AND (is_deleted = false OR is_deleted IS NULL)",
        [userId]
      );
      console.log(`User ${userId}: Found ${landRecords.rows.length} land records.`);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

debugLand();
