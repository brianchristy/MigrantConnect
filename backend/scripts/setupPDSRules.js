const mongoose = require('mongoose');
const EligibilityRule = require('../models/EligibilityRule');
const config = require('../config/config');

async function setupPDSRules() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing PDS rules
    await EligibilityRule.deleteMany({ serviceType: 'pds_verification' });
    console.log('Cleared existing PDS rules');

    const pdsRules = [
      {
        serviceType: 'pds_verification',
        credentialType: 'RationCardVC',
        rules: [
          {
            field: 'documentVerification.verificationStatus',
            operator: 'equals',
            value: 'verified',
            description: 'Document must be verified by issuing authority',
            severity: 'critical'
          },
          {
            field: 'status',
            operator: 'equals',
            value: 'active',
            description: 'Credential must be active',
            severity: 'critical'
          },
          {
            field: 'expiresAt',
            operator: 'date_valid',
            value: 365, // Valid for 1 year
            description: 'Document must not be expired',
            severity: 'critical'
          },
          {
            field: 'pdsDetails.cardType',
            operator: 'in_range',
            value: ['APL', 'BPL', 'AAY'],
            description: 'Card type must be eligible for PDS benefits',
            severity: 'critical'
          },
          {
            field: 'pdsDetails.portabilityStatus',
            operator: 'equals',
            value: 'enabled',
            description: 'Portability must be enabled for cross-state usage',
            severity: 'warning'
          },
          {
            field: 'pdsDetails.familySize',
            operator: 'in_range',
            value: [1, 10],
            description: 'Family size must be between 1 and 10 members',
            severity: 'warning'
          }
        ],
        pdsConfig: {
          cardTypeEntitlements: {
            'APL': {
              'rice': { quantity: 5, unit: 'kg', price: 3 },
              'wheat': { quantity: 3, unit: 'kg', price: 2 },
              'sugar': { quantity: 1, unit: 'kg', price: 13.5 },
              'kerosene': { quantity: 3, unit: 'liters', price: 15 }
            },
            'BPL': {
              'rice': { quantity: 35, unit: 'kg', price: 3 },
              'wheat': { quantity: 35, unit: 'kg', price: 2 },
              'sugar': { quantity: 1, unit: 'kg', price: 13.5 },
              'kerosene': { quantity: 3, unit: 'liters', price: 15 }
            },
            'AAY': {
              'rice': { quantity: 35, unit: 'kg', price: 3 },
              'wheat': { quantity: 35, unit: 'kg', price: 2 },
              'sugar': { quantity: 1, unit: 'kg', price: 13.5 },
              'kerosene': { quantity: 3, unit: 'liters', price: 15 },
              'pulses': { quantity: 1, unit: 'kg', price: 20 }
            },
            'NPHH': {
              'rice': { quantity: 0, unit: 'kg', price: 0 },
              'wheat': { quantity: 0, unit: 'kg', price: 0 },
              'sugar': { quantity: 0, unit: 'kg', price: 0 },
              'kerosene': { quantity: 0, unit: 'liters', price: 0 }
            }
          },
          portabilityRules: {
            enabledStates: ['Delhi', 'Maharashtra', 'Karnataka', 'Telangana', 'Andhra Pradesh'],
            maxPortabilityDays: 30,
            requireLocalVerification: true
          },
          verificationRequirements: {
            requireDocumentVerification: true,
            requireBiometricVerification: false,
            requireAddressVerification: true,
            maxVerificationAge: 90
          }
        },
        cooldownPeriod: 1, // 1 day cooldown
        maxUsagePerMonth: 30, // 30 verifications per month
        entitlement: 'PDS Monthly Entitlements',
        description: 'PDS verification with document genuineness check and entitlement calculation',
        isActive: true,
        priority: 1
      }
    ];

    for (const rule of pdsRules) {
      const newRule = new EligibilityRule(rule);
      await newRule.save();
      console.log(`Created PDS rule: ${rule.description}`);
    }

    console.log('PDS rules setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up PDS rules:', error);
    process.exit(1);
  }
}

setupPDSRules(); 