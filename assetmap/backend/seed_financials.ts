import { pool } from './src/db/connection';
import { fetchFinancialData } from './src/services/accountAggregator';

async function seedFinancialData() {
  try {
    // 1. Update fi_types to include all financial types
    await pool.query(`
      UPDATE consents 
      SET fi_types = ARRAY['DEPOSIT'::fi_type, 'EQUITY'::fi_type, 'MUTUAL_FUND'::fi_type, 'INSURANCE_POLICIES'::fi_type, 'NPS'::fi_type, 'LAND_RECORDS'::fi_type] 
      WHERE purpose = 'Dummy Consent';
    `);
    console.log('Updated fi_types on dummy consents.');

    // 2. Fetch financial data for all users to populate the mock tables
    const userRes = await pool.query('SELECT id FROM users');
    for (const row of userRes.rows) {
      const userId = row.id;
      
      const consentRes = await pool.query('SELECT consent_id FROM consents WHERE user_id = $1 AND status = $2', [userId, 'ACTIVE']);
      if (consentRes.rows.length > 0) {
        const consentId = consentRes.rows[0].consent_id;
        console.log(`Fetching financial data for user ${userId} with consent ${consentId}...`);
        await fetchFinancialData(consentId, userId);
      }
    }
    
    console.log('Successfully seeded financial mock data for all users!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

seedFinancialData();
