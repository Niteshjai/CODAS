import { pool } from './src/db/connection';
import { fetchFinancialData } from './src/services/accountAggregator';
import * as crypto from 'crypto';
import { encryptPII } from './src/utils/encryption';

async function seedDevEnv() {
  try {
    console.log('--- Wiping Database ---');
    await pool.query('TRUNCATE TABLE users CASCADE');
    console.log('All users and related data truncated.');

    console.log('--- Creating User: Nitesh ---');
    const mobile = '9999999999';
    const mobileHash = crypto.createHash('sha256').update(mobile + (process.env.PII_SALT || '')).digest('hex');
    const aadhaarHash = crypto.createHash('sha256').update('123456789012' + (process.env.PII_SALT || '')).digest('hex');

    const userRes = await pool.query(
      `INSERT INTO users (
        aadhaar_hash, mobile_hash, mobile_encrypted, name_encrypted, 
        dob_encrypted, country_code, registered_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id`,
      [
        aadhaarHash,
        mobileHash,
        encryptPII(mobile),
        encryptPII('Nitesh'),
        encryptPII('1990-01-01'),
        '+91'
      ]
    );
    const userId = userRes.rows[0].id;
    console.log('Created user Nitesh with ID:', userId);

    console.log('--- Creating Consent ---');
    const consentId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO consents (
        user_id, consent_id, fi_types, purpose, date_range_start, date_range_end, status
      ) VALUES (
        $1, $2, ARRAY['DEPOSIT'::fi_type, 'EQUITY'::fi_type, 'MUTUAL_FUND'::fi_type, 'INSURANCE_POLICIES'::fi_type, 'NPS'::fi_type, 'LAND_RECORDS'::fi_type],
        'Dummy Consent', '2023-01-01', '2030-12-31', 'ACTIVE'
      )`,
      [userId, consentId]
    );
    console.log('Created comprehensive ACTIVE consent.');

    console.log('--- Fetching Mock AA Data ---');
    process.env.MOCK_MODE = 'true';
    await fetchFinancialData(consentId, userId);
    console.log('Successfully fetched and seeded AA mock financial data.');

    console.log('--- Seeding Land Records ---');
    await pool.query(
      `INSERT INTO land_records (
        user_id, survey_number_enc, owner_name_enc, village, taluka, district, 
        state, state_code, area_value, area_unit, land_type, 
        ownership_type, title_status, mutation_status, source, estimated_value_paise
      ) VALUES 
      ($1, $2, $3, 'Baner', 'Haveli', 'Pune', 'Maharashtra', 'MH', 2.5, 'acres', 'Agricultural', 'inherited', 'clear', 'completed', 'dilrmp', 1500000000),
      ($1, $4, $3, 'Whitefield', 'Bangalore East', 'Bangalore', 'Karnataka', 'KA', 2400, 'sqft', 'Residential', 'self', 'clear', 'completed', 'igr', 850000000)`,
      [userId, encryptPII('SURVEY-101'), encryptPII('Nitesh'), encryptPII('PLOT-45')]
    );
    console.log('Successfully seeded Land Records.');

    console.log('--- Seeding Unclaimed Assets ---');
    await pool.query('DROP TABLE IF EXISTS unclaimed_assets');
    await pool.query(`CREATE TABLE unclaimed_assets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      asset_type VARCHAR(100),
      estimated_value DECIMAL(15, 2),
      source_institution VARCHAR(255),
      status VARCHAR(50),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    await pool.query(
      `INSERT INTO unclaimed_assets (
        user_id, asset_type, estimated_value, source_institution, status
      ) VALUES 
      ($1, 'Provident Fund', 350000, 'EPFO', 'pending'),
      ($1, 'Mutual Fund', 120000, 'SBI Mutual Fund', 'pending')`,
      [userId]
    );
    console.log('Successfully seeded Unclaimed Assets.');

    console.log('====================================');
    console.log('✅ Dev Database Seeded Successfully');
    console.log('Login Mobile: 9999999999');
    console.log('Login PIN: 123456');
    console.log('====================================');

  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await pool.end();
  }
}

seedDevEnv();
