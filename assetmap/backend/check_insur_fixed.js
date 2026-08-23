const { Pool } = require('pg');
require('dotenv').config({ path: 'C:/Users/npnit/OneDrive/Desktop/Financial_OS/assetmap/backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
  const ca = await pool.query("SELECT * FROM canonical_assets WHERE user_id = (SELECT id FROM users LIMIT 1) AND asset_class ILIKE '%insur%'");
  console.log('Canonical AA Insurance:', ca.rows);
  const ma = await pool.query("SELECT * FROM manual_assets WHERE user_id = (SELECT id FROM users LIMIT 1) AND asset_category ILIKE '%insur%'");
  console.log('Manual Assets:', ma.rows);
  process.exit(0);
}
check();
