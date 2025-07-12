const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

// Sample credential for testing
const sampleCredential = {
  type: 'RationCardVC',
  issuedBy: 'FoodDept_Bihar',
  issuedAt: '2024-01-15T10:00:00Z',
  expiresAt: '2025-12-31T23:59:59Z',
  credentialSubject: {
    userId: 'user123',
    entitlement: '5kg/month',
    ONORC_enabled: true,
    last_claimed: '2024-06-15',
    family_size: 4,
    card_number: 'RAT123456789',
    beneficiary_name: 'Rahul Kumar',
    address: 'Patna, Bihar'
  },
  status: 'active'
};

async function testQRGeneration() {
  console.log('🧪 Testing QR Generation...');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/generate-qr`, {
      credential: sampleCredential,
      expiryMinutes: 15
    });

    console.log('✅ QR Generation successful');
    console.log('QR Payload:', JSON.stringify(response.data.qrPayload, null, 2));
    console.log('QR Hash:', response.data.qrHash);
    console.log('Valid Until:', response.data.validUntil);
    
    return response.data;
  } catch (error) {
    console.error('❌ QR Generation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testEligibilityVerification(qrData) {
  console.log('\n🧪 Testing Eligibility Verification...');
  
  try {
    const verificationRequest = {
      vc: sampleCredential,
      service: 'ration_portability',
      verifierId: 'test-verifier-123',
      consentGiven: true,
      location: {
        latitude: 25.5941,
        longitude: 85.1376,
        address: 'Patna, Bihar'
      },
      qrHash: qrData.qrHash
    };

    const response = await axios.post(`${API_BASE_URL}/verify-eligibility`, verificationRequest);

    console.log('✅ Eligibility Verification successful');
    console.log('Result:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Eligibility Verification failed:', error.response?.data || error.message);
    return null;
  }
}

async function testAvailableServices() {
  console.log('\n🧪 Testing Available Services...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/available-services`);
    
    console.log('✅ Available Services retrieved');
    console.log('Services:', JSON.stringify(response.data.services, null, 2));
    
    return response.data.services;
  } catch (error) {
    console.error('❌ Available Services failed:', error.response?.data || error.message);
    return null;
  }
}

async function testHealthEmergencyVerification() {
  console.log('\n🧪 Testing Health Emergency Verification...');
  
  const healthCredential = {
    type: 'HealthCardVC',
    issuedBy: 'HealthDept_Bihar',
    issuedAt: '2024-03-20T14:30:00Z',
    expiresAt: '2025-03-20T14:30:00Z',
    credentialSubject: {
      userId: 'user123',
      coverage_type: 'emergency_health',
      coverage_amount: 'Up to ₹50,000',
      valid_until: '2025-03-20T14:30:00Z',
      hospital_network: ['AIIMS', 'PMCH', 'Private Hospitals'],
      card_number: 'HEALTH987654321',
      beneficiary_name: 'Rahul Kumar',
      emergency_contact: '+91-9876543210'
    },
    status: 'active'
  };

  try {
    const verificationRequest = {
      vc: healthCredential,
      service: 'health_emergency',
      verifierId: 'hospital-verifier-456',
      consentGiven: true,
      location: {
        latitude: 25.5941,
        longitude: 85.1376,
        address: 'AIIMS Patna'
      }
    };

    const response = await axios.post(`${API_BASE_URL}/verify-eligibility`, verificationRequest);

    console.log('✅ Health Emergency Verification successful');
    console.log('Result:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Health Emergency Verification failed:', error.response?.data || error.message);
    return null;
  }
}

async function testQRReuse() {
  console.log('\n🧪 Testing QR Reuse Prevention...');
  
  try {
    // First verification
    const verificationRequest1 = {
      vc: sampleCredential,
      service: 'ration_portability',
      verifierId: 'verifier-1',
      consentGiven: true,
      qrHash: 'test-qr-hash-123'
    };

    const response1 = await axios.post(`${API_BASE_URL}/verify-eligibility`, verificationRequest1);
    console.log('✅ First verification successful');

    // Second verification with same QR hash
    const verificationRequest2 = {
      vc: sampleCredential,
      service: 'ration_portability',
      verifierId: 'verifier-2',
      consentGiven: true,
      qrHash: 'test-qr-hash-123'
    };

    const response2 = await axios.post(`${API_BASE_URL}/verify-eligibility`, verificationRequest2);
    console.log('❌ QR reuse should have been prevented');
    
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already been used')) {
      console.log('✅ QR reuse prevention working correctly');
    } else {
      console.error('❌ QR reuse test failed:', error.response?.data || error.message);
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting QR Verification System Tests\n');
  console.log('API Base URL:', API_BASE_URL);
  console.log('=' .repeat(50));

  // Test available services
  await testAvailableServices();

  // Test QR generation
  const qrData = await testQRGeneration();
  
  if (qrData) {
    // Test eligibility verification
    await testEligibilityVerification(qrData);
  }

  // Test health emergency verification
  await testHealthEmergencyVerification();

  // Test QR reuse prevention
  await testQRReuse();

  console.log('\n' + '=' .repeat(50));
  console.log('🏁 All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testQRGeneration,
  testEligibilityVerification,
  testAvailableServices,
  testHealthEmergencyVerification,
  testQRReuse,
  runAllTests
}; 