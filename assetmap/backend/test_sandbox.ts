import { initiateOKYC } from './src/services/aadhaar';
import { pool, kvStore } from './src/db/connection';

async function runTest() {
  const aadhaar = '676093140014';
  console.log(`Starting Sandbox.co.in Aadhaar test for: ${aadhaar}`);
  
  try {
    const result = await initiateOKYC(aadhaar, '127.0.0.1');
    console.log('\n✅ SUCCESS: API Keys are working and Sandbox API responded!');
    console.log('Result:', result);
    console.log('\nAn OTP should have been sent to the linked mobile number.');
    console.log('To verify, use the transactionId:', result.transactionId);
  } catch (error: any) {
    console.error('\n❌ ERROR: Failed to call Sandbox API');
    console.error(error.message);
  } finally {
    // Cleanup connections so the script can exit
    await pool.end();
    kvStore.disconnect();
  }
}

runTest();
