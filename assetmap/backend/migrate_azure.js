const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// ⚠️ PASTE YOUR AZURE DATABASE URL HERE
const AZURE_DATABASE_URL = 'postgresql://codas_admin:Nitesh123@codas-db-server.postgres.database.azure.com:5432/postgres?sslmode=require';

const client = new Client({
  connectionString: AZURE_DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Azure
});

async function runAzureMigrations() {
  try {
    console.log('Connecting to Azure PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!');

    const migrationsDir = path.join(__dirname, 'src', 'db', 'migrations');
    const allFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    
    // Since the database already has older tables (001 to 019), we will only run the new ones
    // to prevent "relation already exists" errors on older files.
    const files = allFiles.filter(f => f >= '020_missing_financial_tables.sql');

    // Create a migration tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations_tracker (
        filename VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    for (const file of files) {
      const { rows } = await client.query('SELECT * FROM _migrations_tracker WHERE filename = $1', [file]);
      
      if (rows.length === 0) {
        console.log(`\n⏳ Applying ${file}...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        // Execute the migration
        await client.query(sql);
        
        // Mark as applied
        await client.query('INSERT INTO _migrations_tracker (filename) VALUES ($1)', [file]);
        console.log(`✅ Successfully applied ${file}`);
      } else {
        console.log(`⏭️ Skipping ${file} (already applied)`);
      }
    }

    console.log('\n🎉 All Azure migrations are completely up to date!');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

runAzureMigrations();
