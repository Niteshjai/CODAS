const { Client } = require('pg');
const { fetchFinancialData } = require('./src/services/accountAggregator');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function fixConsentAndFetch() {
  try {
    await client.connect();
    
    // 1. Update fi_types for all dummy consents
    await client.query(`
      UPDATE consents 
      SET fi_types = ARRAY['DEPOSIT'::fi_type, 'EQUITY'::fi_type, 'MUTUAL_FUND'::fi_type, 'INSURANCE_POLICIES'::fi_type, 'NPS'::fi_type, 'LAND_RECORDS'::fi_type] 
      WHERE purpose = 'Dummy Consent';
    `);
    console.log('Updated fi_types on dummy consents.');

    // 2. We need to trigger the data fetch to populate the tables for all users
    // But fetchFinancialData uses the pool internally, so we don't need to pass the client to it.
    // However, since it's a TS module, we should run this as a TS script. Let's just create a quick TS script instead.
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

fixConsentAndFetch();
