const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Test QR payload for scanner testing
const testQRPayload = {
  serviceType: 'pds_verification',
  verifierId: 'test-verifier-001',
  criteria: {
    cardTypes: ['APL', 'BPL', 'AAY'],
    requiresDocumentVerification: true,
    maxFamilySize: 10,
    portabilityEnabled: true
  },
  nonce: Date.now(),
  timestamp: new Date().toISOString()
};

async function generateTestQR() {
  try {
    // Create output directory if it doesn't exist
    const outputDir = './test-qr';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate QR code
    const qrData = JSON.stringify(testQRPayload, null, 2);
    const filePath = path.join(outputDir, 'test-service-qr.png');

    await QRCode.toFile(filePath, qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Generate info file
    const infoFile = path.join(outputDir, 'test-qr-info.json');
    fs.writeFileSync(infoFile, JSON.stringify({
      description: 'Test QR Code for Scanner Verification',
      qrPayload: testQRPayload,
      generatedAt: new Date().toISOString(),
      instructions: [
        '1. Open the mobile app',
        '2. Go to Verification Center',
        '3. Choose "Scan QR Code"',
        '4. Scan this QR code',
        '5. The app should parse the QR data and show service information'
      ]
    }, null, 2));

    console.log('✅ Test QR Code Generated Successfully!');
    console.log(`   QR Image: ${filePath}`);
    console.log(`   Info File: ${infoFile}`);
    console.log('');
    console.log('📱 Test Instructions:');
    console.log('   1. Open the mobile app');
    console.log('   2. Go to Verification Center');
    console.log('   3. Choose "Scan QR Code"');
    console.log('   4. Scan this QR code');
    console.log('   5. The app should parse the QR data and show service information');
    console.log('');
    console.log('🔍 QR Payload:');
    console.log(JSON.stringify(testQRPayload, null, 2));

    return { filePath, infoFile, qrPayload: testQRPayload };
  } catch (error) {
    console.error('❌ Error generating test QR:', error.message);
    return null;
  }
}

// Generate a simple text QR for basic scanner testing
async function generateSimpleTestQR() {
  try {
    const outputDir = './test-qr';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const simpleText = 'Hello from MigrantConnect! This is a test QR code.';
    const filePath = path.join(outputDir, 'simple-test-qr.png');

    await QRCode.toFile(filePath, simpleText, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log('✅ Simple Test QR Code Generated!');
    console.log(`   QR Image: ${filePath}`);
    console.log(`   Text: "${simpleText}"`);
    console.log('');
    console.log('📱 Use this to test basic scanner functionality');

    return { filePath, text: simpleText };
  } catch (error) {
    console.error('❌ Error generating simple test QR:', error.message);
    return null;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--service') {
    // Generate service test QR
    generateTestQR();
  } else if (args[0] === '--simple') {
    // Generate simple text QR
    generateSimpleTestQR();
  } else if (args[0] === '--both') {
    // Generate both
    generateTestQR().then(() => {
      console.log('\n' + '='.repeat(50) + '\n');
      generateSimpleTestQR();
    });
  } else {
    console.log('Usage:');
    console.log('  node testQRScanner.js              # Generate service test QR');
    console.log('  node testQRScanner.js --simple     # Generate simple text QR');
    console.log('  node testQRScanner.js --both       # Generate both test QRs');
  }
}

module.exports = {
  generateTestQR,
  generateSimpleTestQR
}; 