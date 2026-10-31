const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  try {
    await client.connect();
    const sql = fs.readFileSync(path.join(__dirname, 'src', 'db', 'migrations', '020_missing_financial_tables.sql'), 'utf8');
    await client.query(sql);
    console.log('Successfully ran missing financial tables migration!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();
