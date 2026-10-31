const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function runFix() {
  try {
    await client.connect();
    const sql = fs.readFileSync(path.join(__dirname, 'src', 'db', 'migrations', '021_fix_fkey.sql'), 'utf8');
    await client.query(sql);
    console.log('Successfully ran fix!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runFix();
