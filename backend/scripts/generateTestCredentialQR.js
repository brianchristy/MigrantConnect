const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Test credential data
const testCredential = {
  id: 'test-credential-001',
  type: 'RationCardVC',
  issuer: 'government-of-india',
  issuanceDate: '2024-01-01T00:00:00Z',
  validFrom: '2024-01-01T00:00:00Z',
  validUntil: '2025-01-01T00:00:00Z',
  status: 'active',
  credentialSubject: {
    id: 'aadhaar-123456789012',
    name: 'Test User',
    aadhaarNumber: '123456789012',
    rationCardNumber: 'RC123456789',
    familySize: 4,
    cardType: 'BPL',
    ONORC_enabled: true,
    homeState: 'Karnataka',
    currentState: 'Karnataka',
    portabilityStatus: 'enabled'
  },
  proof: {
    type: 'Ed25519Signature2020',
    created: '2024-01-01T00:00:00Z',
    verificationMethod: 'did:gov:india#key-1',
    proofPurpose: 'assertionMethod',
    proofValue: 'test-signature-value'
  }
};

async function generateTestCredentialQR() {
  try {
    // Create output directory if it doesn't exist
    const outputDir = './test-qr';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Create QR payload in the expected format
    const validUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    const qrPayload = {
      vc_type: testCredential.type,
      encrypted_payload: Buffer.from(JSON.stringify(testCredential)).toString('base64'),
      valid_until: validUntil.toISOString(),
      nonce: crypto.randomBytes(16).toString('hex')
    };

    // Generate QR code
    const qrData = JSON.stringify(qrPayload, null, 2);
    const fileName = 'test-credential-qr.png';
    const filePath = path.join(outputDir, fileName);

    await QRCode.toFile(filePath, qrData, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Generate info file
    const infoFile = path.join(outputDir, 'test-credential-qr.json');
    fs.writeFileSync(infoFile, JSON.stringify({
      credential: testCredential,
      qrPayload: qrPayload,
      qrData: qrData,
      generatedAt: new Date().toISOString(),
      instructions: [
        '1. This is a test credential QR code',
        '2. Use the mobile app to scan this QR code',
        '3. Select a service for verification',
        '4. The app should process the credential and show eligibility results'
      ]
    }, null, 2));

    console.log('✅ Generated Test Credential QR Code:');
    console.log(`   QR Image: ${filePath}`);
    console.log(`   Info File: ${infoFile}`);
    console.log(`   Credential Type: ${testCredential.type}`);
    console.log(`   Valid Until: ${validUntil.toISOString()}`);
    console.log(`   Nonce: ${qrPayload.nonce}`);
    console.log('');
    console.log('📱 Test Instructions:');
    console.log('   1. Open the mobile app');
    console.log('   2. Go to Verification Center');
    console.log('   3. Select "Verify Credential QR"');
    console.log('   4. Scan this QR code');
    console.log('   5. Select a service for verification');
    console.log('   6. Check the eligibility results');

    return { filePath, infoFile, qrPayload };
  } catch (error) {
    console.error('❌ Error generating test credential QR:', error.message);
    return null;
  }
}

// Generate multiple test credentials
async function generateMultipleTestCredentials() {
  const credentials = [
    {
      ...testCredential,
      id: 'test-ration-card-001',
      type: 'RationCardVC',
      credentialSubject: {
        ...testCredential.credentialSubject,
        cardType: 'BPL',
        ONORC_enabled: true
      }
    },
    {
      ...testCredential,
      id: 'test-health-card-001',
      type: 'HealthCardVC',
      credentialSubject: {
        ...testCredential.credentialSubject,
        coverage_type: 'emergency_health',
        max_coverage: 50000
      }
    },
    {
      ...testCredential,
      id: 'test-education-card-001',
      type: 'EducationCardVC',
      credentialSubject: {
        ...testCredential.credentialSubject,
        education_level: 'secondary',
        scholarship_eligible: true
      }
    }
  ];

  console.log('🚀 Generating Multiple Test Credential QR Codes...\n');
  
  const results = [];
  
  for (const credential of credentials) {
    // Update the test credential
    Object.assign(testCredential, credential);
    
    const result = await generateTestCredentialQR();
    if (result) {
      results.push({ ...result, credentialType: credential.type });
    }
    
    // Wait a bit between generations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total QR codes generated: ${results.length}`);
  console.log(`   Output directory: ./test-qr`);
  console.log(`\n📋 Generated Credentials:`);
  
  results.forEach((result, index) => {
    console.log(`   ${index + 1}. ${result.credentialType} (${path.basename(result.filePath)})`);
  });

  return results;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Generate single test QR
    generateTestCredentialQR();
  } else if (args[0] === '--multiple') {
    // Generate multiple test QRs
    generateMultipleTestCredentials();
  } else {
    console.log('Usage:');
    console.log('  node generateTestCredentialQR.js           # Generate single test QR');
    console.log('  node generateTestCredentialQR.js --multiple # Generate multiple test QRs');
  }
}

module.exports = {
  generateTestCredentialQR,
  generateMultipleTestCredentials,
  testCredential
}; 