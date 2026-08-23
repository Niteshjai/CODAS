const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Nitesh123@localhost:5432/assetmap' });
async function check() {
  await client.connect();
  try {
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log(res.rows.map(r => r.table_name));
  } finally {
    await client.end();
  }
}
check();
