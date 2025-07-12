// Debug utility for API testing
import { API_BASE_URL } from '../config/api';

export const debugAPICall = async () => {
  try {
    console.log('=== API Debug Test ===');
    console.log('API Base URL:', API_BASE_URL);
    
    // Test 1: Simple GET request
    console.log('\n1. Testing GET /api/available-services');
    const getResponse = await fetch(`${API_BASE_URL}/api/available-services`);
    console.log('GET Status:', getResponse.status);
    console.log('GET OK:', getResponse.ok);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('GET Response:', getData);
    } else {
      console.log('GET Error:', await getResponse.text());
    }
    
    // Test 2: POST request to generate QR
    console.log('\n2. Testing POST /api/generate-qr');
    const testCredential = {
      type: 'RationCardVC',
      issuedBy: 'TestDept',
      issuedAt: '2024-01-01T00:00:00Z',
      expiresAt: '2025-12-31T23:59:59Z',
      credentialSubject: {
        userId: 'test123',
        entitlement: '5kg/month',
        ONORC_enabled: true
      },
      status: 'active'
    };
    
    const postResponse = await fetch(`${API_BASE_URL}/api/generate-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        credential: testCredential,
        expiryMinutes: 15
      })
    });
    
    console.log('POST Status:', postResponse.status);
    console.log('POST OK:', postResponse.ok);
    
    if (postResponse.ok) {
      const postData = await postResponse.json();
      console.log('POST Response:', postData);
    } else {
      console.log('POST Error:', await postResponse.text());
    }
    
    console.log('\n=== API Debug Test Complete ===');
    
  } catch (error) {
    console.error('API Debug Test Failed:', error);
  }
}; 