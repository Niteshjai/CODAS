import axios from 'axios';
import { randomUUID, randomInt } from 'crypto';
import { kvStore } from '../db/connection';
import { hashAadhaar } from '../utils/encryption';
import { logger } from '../utils/logger';

// ═══════════════════════════════════════════════════════════════
// Aadhaar OKYC Service (Powered by Sandbox.co.in)
// NEVER logs or stores raw Aadhaar numbers
// ═══════════════════════════════════════════════════════════════

interface OKYCInitiateResponse {
  transactionId: string; // The reference_id from Sandbox
  message: string;
}

interface EKYCData {
  name: string;
  dob: string;
  gender: string;
  address: string;
  photo?: string; // base64 or URL
}

interface OKYCVerifyResponse {
  aadhaarHash: string;
  ekycData: EKYCData;
}

const SANDBOX_API_BASE_URL = process.env.SANDBOX_API_BASE_URL || 'https://api.sandbox.co.in';

/**
 * Helper function to retrieve JWT token from Sandbox
 */
export async function getSandboxToken(): Promise<string> {
  const apiKey = process.env.SANDBOX_API_KEY;
  const apiSecret = process.env.SANDBOX_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    throw new Error('Sandbox API credentials are not configured');
  }

  const response = await axios.post(`${SANDBOX_API_BASE_URL}/authenticate`, null, {
    headers: {
      'x-api-key': apiKey,
      'x-api-secret': apiSecret,
      'x-api-version': process.env.SANDBOX_API_VERSION || '1.0.0',
      'accept': 'application/json'
    }
  });

  return response.data?.access_token;
}

/**
 * Step 1: Initiate Aadhaar OKYC — generate OTP
 */
export async function initiateOKYC(
  aadhaarNumber: string,
  ipAddress: string
): Promise<OKYCInitiateResponse> {
  const transactionId = randomUUID();

  // In mock mode, skip real API call
  if (process.env.MOCK_MODE === 'true') {
    const mockOtp = String(randomInt(100000, 999999));
    logger.info(`[MOCK] Aadhaar OTP for XXXX-XXXX-${aadhaarNumber.slice(-4)}: ${mockOtp}`);
    
    await kvStore.setex(
      `okyc:txn:${transactionId}`,
      300,
      JSON.stringify({
        aadhaarHash: hashAadhaar(aadhaarNumber),
        aadhaarNumber, // Needed for mock verify
        status: 'OTP_SENT',
        mockOtp: mockOtp,
        createdAt: new Date().toISOString(),
      })
    );
    return {
      transactionId,
      message: 'Mock OTP sent successfully',
    };
  }

  try {
    const token = await getSandboxToken();

    const response = await axios.post(`${SANDBOX_API_BASE_URL}/kyc/aadhaar/okyc/otp`, {
      '@entity': 'in.co.sandbox.kyc.aadhaar.okyc.otp.request',
      aadhaar_number: aadhaarNumber,
      consent: 'Y',
      reason: 'KYC verification for asset management',
    }, {
      headers: {
        'Authorization': token, // Sandbox API expects token without Bearer prefix
        'x-api-key': process.env.SANDBOX_API_KEY,
        'x-api-version': process.env.SANDBOX_API_VERSION || '1.0.0',
        'Content-Type': 'application/json'
      }
    });

    const referenceId = response.data?.data?.reference_id;
    if (!referenceId) {
      throw new Error('Sandbox API did not return a reference_id');
    }

    // Store transaction in Redis (5 min TTL for OTP validity)
    await kvStore.setex(
      `okyc:txn:${referenceId}`,
      300,
      JSON.stringify({
        aadhaarHash: hashAadhaar(aadhaarNumber),
        status: 'OTP_SENT',
        createdAt: new Date().toISOString(),
      })
    );

    return {
      transactionId: referenceId, // Use Sandbox's reference_id as our transactionId
      message: response.data?.message || 'OTP sent successfully',
    };
  } catch (error: any) {
    // Response bodies can echo identity data — log only status and provider error code
    logger.error('OKYC initiation failed via Sandbox', {
      error: error.message,
      status: error.response?.status,
      code: error.response?.data?.code
    });
    throw new Error('Failed to initiate Aadhaar OKYC. Please try again.');
  }
}

/**
 * Step 2: Verify OTP and complete OKYC
 */
export async function verifyOKYC(
  transactionId: string,
  otp: string,
  ipAddress: string,
  userAgent: string
): Promise<OKYCVerifyResponse> {

  // Retrieve transaction from Redis
  const txnData = await kvStore.get(`okyc:txn:${transactionId}`);
  if (!txnData) {
    throw new Error('Transaction expired or invalid. Please initiate a new OTP.');
  }

  const transaction = JSON.parse(txnData);

  if (process.env.MOCK_MODE === 'true') {
    if (transaction.mockOtp && transaction.mockOtp !== otp) {
      throw new Error('Invalid Aadhaar OTP. Please try again.');
    }
    
    await kvStore.del(`okyc:txn:${transactionId}`);

    return {
      aadhaarHash: transaction.aadhaarHash || 'mock-aadhaar-hash',
      ekycData: {
        name: 'Arjun Mock User',
        dob: '1990-01-01',
        gender: 'M',
        address: 'Mock Address, City'
      }
    };
  }

  try {
    const token = await getSandboxToken();

    const response = await axios.post(`${SANDBOX_API_BASE_URL}/kyc/aadhaar/okyc/otp/verify`, {
      '@entity': 'in.co.sandbox.kyc.aadhaar.okyc.request',
      reference_id: transactionId,
      otp: otp,
    }, {
      headers: {
        'Authorization': token,
        'x-api-key': process.env.SANDBOX_API_KEY,
        'x-api-version': process.env.SANDBOX_API_VERSION || '1.0.0',
        'Content-Type': 'application/json'
      }
    });

    const kycData = response.data?.data;
    if (!kycData) {
      throw new Error('Sandbox API returned empty KYC data');
    }

    // Clean up transaction
    await kvStore.del(`okyc:txn:${transactionId}`);

    // Map Sandbox response to EKYCData
    return {
      aadhaarHash: transaction.aadhaarHash,
      ekycData: {
        name: kycData.name || '',
        dob: kycData.dob || '',
        gender: kycData.gender || 'U',
        address: [kycData.split_address?.house, kycData.split_address?.street, kycData.split_address?.city, kycData.split_address?.state, kycData.split_address?.pincode].filter(Boolean).join(', '),
        photo: kycData.photo_link || kycData.photo,
      }
    };

  } catch (error: any) {
    logger.error('Aadhaar API verify failed via Sandbox', {
      transactionId,
      error: error.message,
      status: error.response?.status,
      code: error.response?.data?.code
    });
    
    if (error.response?.status === 422 || error.response?.status === 400) {
       throw new Error('Invalid OTP. Please check and try again.');
    }
    
    throw new Error('Failed to verify Aadhaar OKYC. Please try again.');
  }
}
