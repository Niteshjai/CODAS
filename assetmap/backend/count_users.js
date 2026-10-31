const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function countUsers() {
  await client.connect();
  try {
    const res = await client.query('SELECT COUNT(*) FROM users');
    console.log(`There are ${res.rows[0].count} users in the database.`);
  } finally {
    await client.end();
  }
}
countUsers();
