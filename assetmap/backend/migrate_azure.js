// Apply pending SQL migrations to an existing database (e.g. Azure production).
//
//   MIGRATE_DATABASE_URL=... node migrate_azure.js --dry-run        # list what would run
//   MIGRATE_DATABASE_URL=... node migrate_azure.js                  # apply all pending
//   MIGRATE_DATABASE_URL=... node migrate_azure.js --through=031    # stop after 031
//   MIGRATE_DATABASE_URL=... node migrate_azure.js --baseline-through=026
//        # record 001..026 as applied WITHOUT running them (one-time, for a DB built another way)
//
// AZURE_DATABASE_URL is accepted as an alias. Never commit the URL.
// Applied files are tracked in _migrations_tracker (same table the old script used, so
// production's existing history is kept). Each file runs in its own transaction together
// with its tracker row: a failing file leaves nothing half-applied and stops the run.
// SSL is verified for remote hosts; pass --no-ssl only for a local database.

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};

const url = process.env.MIGRATE_DATABASE_URL || process.env.AZURE_DATABASE_URL;
if (!url) {
  console.error('Set MIGRATE_DATABASE_URL (or AZURE_DATABASE_URL) to the target database.');
  process.exit(1);
}

const dryRun = flag('dry-run');
const through = opt('through');
const baselineThrough = opt('baseline-through');
// Before this runner existed, production was migrated from 020 onwards; older files were
// applied when the database was created. Keep that floor unless explicitly overridden.
const from = opt('from') ?? '020';

const host = (() => { try { return new URL(url).hostname; } catch { return ''; } })();
const isLocal = ['localhost', '127.0.0.1', '::1'].includes(host);
const ssl = flag('no-ssl') || isLocal ? false : { rejectUnauthorized: true };

const migrationsDir = path.join(__dirname, 'src', 'db', 'migrations');
const prefix = (f) => f.split('_')[0];
const allFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

async function main() {
  const client = new Client({ connectionString: url, ssl });
  await client.connect();
  console.log(`Connected to ${host || 'database'}${dryRun ? ' (dry run — nothing will change)' : ''}`);

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations_tracker (
        filename   VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    const applied = new Set((await client.query('SELECT filename FROM _migrations_tracker')).rows.map((r) => r.filename));

    if (baselineThrough) {
      const toMark = allFiles.filter((f) => prefix(f) <= baselineThrough && !applied.has(f));
      for (const f of toMark) {
        console.log(`${dryRun ? 'would mark' : 'marking'} ${f} as already applied`);
        if (!dryRun) await client.query('INSERT INTO _migrations_tracker (filename) VALUES ($1) ON CONFLICT DO NOTHING', [f]);
      }
      console.log(`Baseline: ${toMark.length} file(s) ${dryRun ? 'would be' : ''} recorded without running.`);
      return 0;
    }

    const pending = allFiles.filter((f) => prefix(f) >= from && (!through || prefix(f) <= through) && !applied.has(f));
    if (!pending.length) {
      console.log('Up to date — no pending migrations.');
      return 0;
    }
    console.log(`Pending (${pending.length}): ${pending.join(', ')}`);
    if (dryRun) return 0;

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      const started = Date.now();
      process.stdout.write(`Applying ${file} … `);
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations_tracker (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`done (${Date.now() - started} ms)`);
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.log('FAILED');
        console.error(`\n${file} was rolled back: ${err.message}`);
        if (err.position) console.error(`at character ${err.position} of ${file}`);
        console.error('Later migrations were not attempted. Fix the cause and re-run.');
        return 1;
      }
    }
    console.log('All pending migrations applied.');
    return 0;
  } finally {
    await client.end();
  }
}

main().then((code) => process.exit(code), (err) => {
  console.error('Migration run failed:', err.message);
  process.exit(1);
});
