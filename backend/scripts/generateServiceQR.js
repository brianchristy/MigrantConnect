const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Service configurations
const services = [
  {
    name: 'PDS Verification',
    serviceType: 'pds_verification',
    verifierId: 'pds-shop-001',
    description: 'Public Distribution System - Ration Card Verification',
    criteria: {
      cardTypes: ['APL', 'BPL', 'AAY'],
      requiresDocumentVerification: true,
      maxFamilySize: 10,
      portabilityEnabled: true
    }
  },
  {
    name: 'Healthcare Emergency',
    serviceType: 'health_emergency',
    verifierId: 'hospital-emergency-001',
    description: 'Emergency Healthcare Access',
    criteria: {
      requiresHealthCard: true,
      maxCoverageAmount: 50000,
      emergencyOnly: true
    }
  },
  {
    name: 'Education Scholarship',
    serviceType: 'education_scholarship',
    verifierId: 'education-dept-001',
    description: 'Educational Scholarship Verification',
    criteria: {
      requiresEducationCard: true,
      maxScholarshipAmount: 10000,
      academicYear: '2024-25'
    }
  },
  {
    name: 'Skill Training',
    serviceType: 'skill_training',
    verifierId: 'skill-center-001',
    description: 'Skill Development Training Access',
    criteria: {
      requiresSkillCert: true,
      maxTrainingDuration: 6,
      ageLimit: [18, 45]
    }
  }
];

async function generateServiceQR(service, outputDir = './service-qrs') {
  try {
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate QR payload
    const qrPayload = {
      serviceType: service.serviceType,
      verifierId: service.verifierId,
      criteria: service.criteria,
      nonce: Date.now(),
      timestamp: new Date().toISOString()
    };

    // Generate QR code
    const qrData = JSON.stringify(qrPayload, null, 2);
    const fileName = `${service.serviceType}-${service.verifierId}.png`;
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
    const infoFile = path.join(outputDir, `${service.serviceType}-${service.verifierId}.json`);
    fs.writeFileSync(infoFile, JSON.stringify({
      service: service.name,
      description: service.description,
      qrPayload: qrPayload,
      generatedAt: new Date().toISOString()
    }, null, 2));

    console.log(`✅ Generated QR for ${service.name}:`);
    console.log(`   QR Image: ${filePath}`);
    console.log(`   Info File: ${infoFile}`);
    console.log(`   Service Type: ${service.serviceType}`);
    console.log(`   Verifier ID: ${service.verifierId}`);
    console.log('');

    return { filePath, infoFile, qrPayload };
  } catch (error) {
    console.error(`❌ Error generating QR for ${service.name}:`, error.message);
    return null;
  }
}

async function generateAllServiceQRs() {
  console.log('🚀 Generating Service QR Codes...\n');
  
  const results = [];
  
  for (const service of services) {
    const result = await generateServiceQR(service);
    if (result) {
      results.push(result);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total QR codes generated: ${results.length}`);
  console.log(`   Output directory: ./service-qrs`);
  console.log(`\n📋 Generated Services:`);
  
  results.forEach((result, index) => {
    const service = services[index];
    console.log(`   ${index + 1}. ${service.name} (${service.serviceType})`);
  });

  console.log('\n🎯 Next Steps:');
  console.log('   1. Print or display the QR codes at service centers');
  console.log('   2. Users can scan these QR codes with their mobile app');
  console.log('   3. The app will prompt users to select their credentials');
  console.log('   4. Eligibility verification will be performed automatically');

  return results;
}

// Generate QR for a specific service
async function generateSpecificServiceQR(serviceType) {
  const service = services.find(s => s.serviceType === serviceType);
  if (!service) {
    console.error(`❌ Service type "${serviceType}" not found`);
    console.log('Available services:', services.map(s => s.serviceType).join(', '));
    return;
  }
  
  return await generateServiceQR(service);
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Generate all QR codes
    generateAllServiceQRs();
  } else if (args[0] === '--service' && args[1]) {
    // Generate QR for specific service
    generateSpecificServiceQR(args[1]);
  } else if (args[0] === '--list') {
    // List available services
    console.log('📋 Available Services:');
    services.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} (${service.serviceType})`);
      console.log(`      Description: ${service.description}`);
      console.log(`      Verifier ID: ${service.verifierId}`);
      console.log('');
    });
  } else {
    console.log('Usage:');
    console.log('  node generateServiceQR.js                    # Generate all QR codes');
    console.log('  node generateServiceQR.js --service <type>   # Generate QR for specific service');
    console.log('  node generateServiceQR.js --list             # List available services');
    console.log('');
    console.log('Examples:');
    console.log('  node generateServiceQR.js --service pds_verification');
    console.log('  node generateServiceQR.js --service health_emergency');
  }
}

module.exports = {
  generateServiceQR,
  generateAllServiceQRs,
  generateSpecificServiceQR,
  services
}; 