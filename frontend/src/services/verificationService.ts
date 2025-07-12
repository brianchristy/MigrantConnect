import axios from 'axios';
import { VerifiableCredential } from './credentialStorage';
import { API_BASE_URL } from '../config/api';

export interface QRPayload {
  vc_type: string;
  encrypted_payload: string;
  valid_until: string;
  nonce: string;
}

export interface VerificationRequest {
  vc: VerifiableCredential;
  service: string;
  verifierId: string;
  consentGiven: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  qrHash?: string;
}

export interface VerificationResponse {
  success: boolean;
  eligible: boolean;
  entitlement?: string;
  reason: string;
  timestamp: string;
}

export interface ServiceInfo {
  id: string;
  name: string;
  description: string;
  credentialTypes: string[];
}

class VerificationService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 10000,
  });

  constructor() {
    // Add request interceptor for logging
    this.api.interceptors.request.use(
      (config) => {
        console.log('Making request to:', config.url);
        console.log('Full URL:', (config.baseURL || '') + (config.url || ''));
        console.log('Method:', config.method);
        console.log('Data:', config.data);
        return config;
      },
      (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.api.interceptors.response.use(
      (response) => {
        console.log('Response received:', response.status, response.config.url);
        return response;
      },
      (error) => {
        console.error('Response error:', error.response?.status, error.config?.url);
        return Promise.reject(error);
      }
    );
  }

  async generateQR(credential: VerifiableCredential, expiryMinutes: number = 15): Promise<{
    qrPayload: QRPayload;
    qrHash: string;
    validUntil: string;
  }> {
    try {
      console.log('Generating QR for credential:', credential.type);
      console.log('API Base URL:', API_BASE_URL);
      console.log('Full URL will be:', `${API_BASE_URL}/generate-qr`);
      
      const requestData = {
        credential,
        expiryMinutes
      };
      console.log('Request data:', JSON.stringify(requestData, null, 2));
      
      const response = await this.api.post('/generate-qr', requestData);

      console.log('QR generation response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error generating QR:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method
      });
      throw new Error(`Failed to generate QR code: ${error.message || 'Unknown error'}`);
    }
  }

  async verifyEligibility(request: VerificationRequest): Promise<VerificationResponse> {
    try {
      console.log('Verifying eligibility for service:', request.service);
      const response = await this.api.post('/verify-eligibility', request);
      console.log('Verification response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error verifying eligibility:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 403) {
        throw new Error('Verification denied - user consent not given');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Invalid verification request');
      } else {
        throw new Error(`Failed to verify eligibility: ${error.message || 'Unknown error'}`);
      }
    }
  }

  async getAvailableServices(): Promise<ServiceInfo[]> {
    try {
      console.log('Fetching available services from:', `${API_BASE_URL}/available-services`);
      const response = await this.api.get('/available-services');
      console.log('Available services response:', response.data);
      return response.data.services;
    } catch (error: any) {
      console.error('Error fetching available services:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      return [];
    }
  }

  async getVerificationHistory(userId: string, limit: number = 10, offset: number = 0): Promise<any[]> {
    try {
      const response = await this.api.get(`/verification-history/${userId}`, {
        params: { limit, offset }
      });
      return response.data.logs;
    } catch (error) {
      console.error('Error fetching verification history:', error);
      return [];
    }
  }

  // Offline fallback verification (for when network is unavailable)
  async verifyEligibilityOffline(credential: VerifiableCredential, service: string): Promise<VerificationResponse> {
    // Simple offline rule evaluation
    const rules = this.getOfflineRules();
    const rule = rules.find(r => r.service === service && r.credentialType === credential.type);

    if (!rule) {
      return {
        success: false,
        eligible: false,
        reason: 'No offline rules available for this service',
        timestamp: new Date().toISOString()
      };
    }

    // Basic rule evaluation
    const isEligible = this.evaluateOfflineRule(credential, rule);

    return {
      success: true,
      eligible: isEligible,
      entitlement: isEligible ? rule.entitlement : undefined,
      reason: isEligible ? 'Eligible based on offline rules' : 'Not eligible based on offline rules',
      timestamp: new Date().toISOString()
    };
  }

  private getOfflineRules() {
    return [
      {
        service: 'ration_portability',
        credentialType: 'RationCardVC',
        rules: [
          { field: 'credentialSubject.ONORC_enabled', value: true },
          { field: 'status', value: 'active' }
        ],
        entitlement: '5kg/month'
      },
      {
        service: 'health_emergency',
        credentialType: 'HealthCardVC',
        rules: [
          { field: 'credentialSubject.coverage_type', value: 'emergency_health' },
          { field: 'status', value: 'active' }
        ],
        entitlement: 'Up to ₹50,000'
      }
    ];
  }

  private evaluateOfflineRule(credential: VerifiableCredential, rule: any): boolean {
    for (const condition of rule.rules) {
      const fieldValue = this.getNestedValue(credential, condition.field);
      if (fieldValue !== condition.value) {
        return false;
      }
    }
    return true;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
}

export default new VerificationService(); 