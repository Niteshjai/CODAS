const { Pool } = require('pg');
require('dotenv').config({ path: 'C:/Users/npnit/OneDrive/Desktop/Financial_OS/assetmap/backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function check() {
  const caCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'canonical_assets'");
  console.log('canonical_assets columns:', caCols.rows.map(r=>r.column_name).join(', '));
  const maCols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'manual_assets'");
  console.log('manual_assets columns:', maCols.rows.map(r=>r.column_name).join(', '));
  
  const aa = await pool.query("SELECT * FROM canonical_assets WHERE user_id = (SELECT id FROM users LIMIT 1) LIMIT 10");
  if (aa.rows.length) {
      console.log('Sample Canonical Asset:', aa.rows[0]);
  }
  process.exit(0);
}
check();
