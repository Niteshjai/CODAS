const { Pool } = require('pg');
require('dotenv').config({ path: 'C:/Users/npnit/OneDrive/Desktop/Financial_OS/assetmap/backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
  const aa = await pool.query("SELECT id, fi_type, current_value_paise FROM canonical_assets WHERE user_id = (SELECT id FROM users LIMIT 1)");
  console.log('Canonical AA Insurance:', aa.rows.filter(r => (r.fi_type || '').toLowerCase().includes('insur')));
  process.exit(0);
}
check();
