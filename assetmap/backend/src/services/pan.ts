import axios from 'axios';
import { logger } from '../utils/logger';
import { getSandboxToken } from './aadhaar';

const SANDBOX_API_BASE_URL = process.env.SANDBOX_API_BASE_URL || 'https://api.sandbox.co.in';

export interface PanVerificationResult {
  isValid: boolean;
  fullName?: string;
  category?: string;
  message?: string;
  nameMatch?: boolean;
  dobMatch?: boolean;
}

/**
 * Verify PAN using Sandbox API
 */
export async function verifyPanDetails(panNumber: string, panName: string, dobYYYYMMDD: string): Promise<PanVerificationResult> {
  // In mock mode, skip real API call and simulate success
  if (process.env.MOCK_MODE === 'true') {
    logger.info(`[MOCK] Verifying PAN: ${panNumber}`);
    return {
      isValid: true,
      fullName: panName || 'Arjun Sharma',
      category: 'Individual',
      message: 'Mock verification successful',
      nameMatch: true,
      dobMatch: true
    };
  }

  try {
    const token = await getSandboxToken();
    
    // Convert YYYY-MM-DD to DD/MM/YYYY for Sandbox
    const [year, month, day] = dobYYYYMMDD.split('-');
    const dobFormatted = `${day}/${month}/${year}`;

    const response = await axios.post(`${SANDBOX_API_BASE_URL}/kyc/pan`, {
      '@entity': 'in.co.sandbox.kyc.pan_verification.request',
      pan: panNumber,
      name_as_per_pan: panName,
      date_of_birth: dobFormatted,
      consent: 'Y',
      reason: 'KYC PAN verification for asset management',
    }, {
      headers: {
        'Authorization': token,
        'x-api-key': process.env.SANDBOX_API_KEY,
        'x-api-version': process.env.SANDBOX_API_VERSION || '1.0.0',
        'Content-Type': 'application/json'
      }
    });

    const data = response.data?.data;
    if (!data) {
      throw new Error('Sandbox API returned empty PAN data');
    }

    if (data.status === 'VALID' || data.status === 'Active') {
      return {
        isValid: true,
        fullName: data.full_name,
        category: data.category,
        message: response.data.message,
        nameMatch: data.name_match,
        dobMatch: data.date_of_birth_match
      };
    } else {
      return {
        isValid: false,
        message: data.status || 'Invalid PAN status'
      };
    }
  } catch (error: any) {
    logger.error('PAN verification failed via Sandbox', {
      error: error.message,
      response: error.response?.data
    });
    
    if (error.response?.status === 422 || error.response?.status === 400 || error.response?.status === 404) {
      return {
        isValid: false,
        message: error.response?.data?.message || 'Invalid PAN Number'
      };
    }
    
    throw new Error('Failed to verify PAN. Please try again.');
  }
}
