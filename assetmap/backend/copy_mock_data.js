const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Nitesh123@localhost:5432/assetmap' });

async function linkData() {
  await client.connect();
  try {
    // 1. Get the latest user ID
    const res = await client.query('SELECT id FROM users ORDER BY created_at DESC LIMIT 1');
    if (res.rows.length === 0) {
      console.log('No users found.');
      return;
    }
    const newUserId = res.rows[0].id;
    console.log(`Copying mock data to newest user: ${newUserId}`);

    // 2. Get the seeded user ID (the first one)
    const seedRes = await client.query('SELECT id FROM users ORDER BY created_at ASC LIMIT 1');
    const seedUserId = seedRes.rows[0].id;

    if (newUserId === seedUserId) {
       console.log('Newest user is the seeded user. Nothing to copy.');
       return;
    }

    // 3. Copy Land Records
    await client.query(`
      INSERT INTO land_records (
        user_id, survey_number_enc, owner_name_enc, village, taluka, district, 
        state, state_code, area_value, area_unit, land_type, 
        ownership_type, title_status, mutation_status, source, estimated_value_paise
      )
      SELECT 
        $1, survey_number_enc, owner_name_enc, village, taluka, district, 
        state, state_code, area_value, area_unit, land_type, 
        ownership_type, title_status, mutation_status, source, estimated_value_paise
      FROM land_records
      WHERE user_id = $2
    `, [newUserId, seedUserId]);
    console.log('Copied land records.');

    // 4. Copy Unclaimed Assets
    await client.query(`
      INSERT INTO unclaimed_assets (
        user_id, asset_type, estimated_value, source_institution, status, created_at
      )
      SELECT 
        $1, asset_type, estimated_value, source_institution, status, created_at
      FROM unclaimed_assets
      WHERE user_id = $2
    `, [newUserId, seedUserId]);
    console.log('Copied unclaimed assets.');
    
    // Also copy manual assets if there were any
    try {
      await client.query(`
        INSERT INTO manual_assets (
          user_id, name, asset_type, estimated_value_paise, purchase_price_paise,
          purchase_date, currency, is_active
        )
        SELECT 
          $1, name, asset_type, estimated_value_paise, purchase_price_paise,
          purchase_date, currency, is_active
        FROM manual_assets
        WHERE user_id = $2
      `, [newUserId, seedUserId]);
      console.log('Copied manual assets.');
    } catch(e) {
      // ignore
    }

    console.log('Successfully injected mock property and unclaimed data for your new account!');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}
linkData();
