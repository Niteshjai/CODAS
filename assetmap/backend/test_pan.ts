import 'dotenv/config';
import { verifyPanDetails } from './src/services/pan';

async function runTest() {
  const panName = "Beby Jaishwal";
  const panNumber = "DDLPJ8189L"; 
  const panDob = "1983-01-01"; // YYYY-MM-DD

  console.log('--- Starting PAN Verification Test ---');
  console.log(`Input PAN: ${panNumber}`);
  console.log(`Input Name: ${panName}`);
  console.log(`Input DOB: ${panDob}`);

  // Force MOCK_MODE to false for this script
  process.env.MOCK_MODE = 'false';

  try {
    console.log('Calling Sandbox PAN API...');
    const result = await verifyPanDetails(panNumber, panName, panDob);
    
    console.log('\n--- Result from Sandbox ---');
    console.log(JSON.stringify(result, null, 2));

  } catch (err: any) {
    console.error('Error testing PAN:', err.message);
  }
}

runTest();
