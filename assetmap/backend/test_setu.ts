import { createConsentRequest } from './src/services/accountAggregator';
import { pool } from './src/db/connection';
import { randomUUID } from 'crypto';

// Force production mode to bypass the local dev mock fallback
process.env.NODE_ENV = 'production';
process.env.MOCK_MODE = 'false';

async function runTest() {
  console.log('Starting Setu Account Aggregator test...');
  
  try {
    const result = await createConsentRequest(
      randomUUID(),
      ['DEPOSIT', 'EQUITY', 'MUTUAL_FUND'], // fiTypes
      'Wealth Tracking', // purpose
      { start: '2023-01-01T00:00:00Z', end: '2024-01-01T00:00:00Z' }, // dateRange
      '127.0.0.1',
      'Test Script'
    );
    console.log('\n✅ SUCCESS: Setu Sandbox API responded!');
    console.log('Consent Result:', result);
    console.log('\nRedirect URL:', result.redirectUrl);
  } catch (error: any) {
    console.error('\n❌ ERROR: Failed to call Setu API');
    console.error(error.message);
  } finally {
    // Cleanup connections so the script can exit
    await pool.end();
  }
}

runTest();
