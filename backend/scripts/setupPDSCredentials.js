const mongoose = require('mongoose');
const VerifiableCredential = require('../models/VerifiableCredential');
const config = require('../config/config');
const crypto = require('crypto');

async function setupPDSCredentials() {
  try {
    await mongoose.connect(config.mongoURI);
    console.log('Connected to MongoDB');

    // Clear existing PDS credentials
    await VerifiableCredential.deleteMany({ type: 'RationCardVC' });
    console.log('Cleared existing PDS credentials');

    const sampleCredentials = [
      {
        type: 'RationCardVC',
        issuedBy: 'Food and Civil Supplies Department, Maharashtra',
        issuedAt: new Date('2024-01-15'),
        expiresAt: new Date('2025-01-15'),
        credentialSubject: {
          name: 'Rajesh Kumar',
          aadhaarNumber: '123456789012',
          address: '123 Main Street, Mumbai, Maharashtra',
          phoneNumber: '+91-9876543210'
        },
        documentVerification: {
          documentHash: crypto.createHash('sha256').update('RationCard123456').digest('hex'),
          documentType: 'ration_card',
          documentNumber: 'RC-MH-2024-001234',
          verificationStatus: 'verified',
          verifiedBy: 'Food and Civil Supplies Department',
          verifiedAt: new Date('2024-01-20'),
          verificationNotes: 'Document verified through physical verification'
        },
        pdsDetails: {
          cardType: 'BPL',
          familySize: 4,
          monthlyEntitlement: {
            rice: 35,
            wheat: 35,
            sugar: 1,
            kerosene: 3,
            pulses: 0
          },
          lastPurchaseDate: new Date('2024-12-01'),
          purchaseHistory: [
            {
              date: new Date('2024-12-01'),
              items: [
                { item: 'rice', quantity: 35, unit: 'kg' },
                { item: 'wheat', quantity: 35, unit: 'kg' },
                { item: 'sugar', quantity: 1, unit: 'kg' },
                { item: 'kerosene', quantity: 3, unit: 'liters' }
              ]
            }
          ],
          portabilityStatus: 'enabled',
          homeState: 'Maharashtra',
          currentState: 'Maharashtra'
        },
        proof: {
          type: 'Ed25519Signature2020',
          created: new Date(),
          verificationMethod: 'did:example:123456789abcdefghi#keys-1',
          proofPurpose: 'assertionMethod',
          proofValue: 'z58DDoFefrtUpHMLtiS4gUSr8VTVqE6BxHpGciFUqG8ETDruNsw4HnD9DqxFqkQJvePKDLNqwj6g6DG9WbKxTibGf'
        },
        status: 'active'
      },
      {
        type: 'RationCardVC',
        issuedBy: 'Food and Civil Supplies Department, Delhi',
        issuedAt: new Date('2024-02-10'),
        expiresAt: new Date('2025-02-10'),
        credentialSubject: {
          name: 'Priya Sharma',
          aadhaarNumber: '987654321098',
          address: '456 Park Avenue, New Delhi, Delhi',
          phoneNumber: '+91-8765432109'
        },
        documentVerification: {
          documentHash: crypto.createHash('sha256').update('RationCard654321').digest('hex'),
          documentType: 'ration_card',
          documentNumber: 'RC-DL-2024-005678',
          verificationStatus: 'verified',
          verifiedBy: 'Food and Civil Supplies Department',
          verifiedAt: new Date('2024-02-15'),
          verificationNotes: 'Document verified through Aadhaar linkage'
        },
        pdsDetails: {
          cardType: 'AAY',
          familySize: 6,
          monthlyEntitlement: {
            rice: 35,
            wheat: 35,
            sugar: 1,
            kerosene: 3,
            pulses: 1
          },
          lastPurchaseDate: new Date('2024-11-25'),
          purchaseHistory: [
            {
              date: new Date('2024-11-25'),
              items: [
                { item: 'rice', quantity: 35, unit: 'kg' },
                { item: 'wheat', quantity: 35, unit: 'kg' },
                { item: 'sugar', quantity: 1, unit: 'kg' },
                { item: 'kerosene', quantity: 3, unit: 'liters' },
                { item: 'pulses', quantity: 1, unit: 'kg' }
              ]
            }
          ],
          portabilityStatus: 'enabled',
          homeState: 'Delhi',
          currentState: 'Delhi'
        },
        proof: {
          type: 'Ed25519Signature2020',
          created: new Date(),
          verificationMethod: 'did:example:123456789abcdefghi#keys-1',
          proofPurpose: 'assertionMethod',
          proofValue: 'z58DDoFefrtUpHMLtiS4gUSr8VTVqE6BxHpGciFUqG8ETDruNsw4HnD9DqxFqkQJvePKDLNqwj6g6DG9WbKxTibGf'
        },
        status: 'active'
      },
      {
        type: 'RationCardVC',
        issuedBy: 'Food and Civil Supplies Department, Karnataka',
        issuedAt: new Date('2024-03-05'),
        expiresAt: new Date('2025-03-05'),
        credentialSubject: {
          name: 'Amit Patel',
          aadhaarNumber: '456789012345',
          address: '789 Tech Park, Bangalore, Karnataka',
          phoneNumber: '+91-7654321098'
        },
        documentVerification: {
          documentHash: crypto.createHash('sha256').update('RationCard789012').digest('hex'),
          documentType: 'ration_card',
          documentNumber: 'RC-KA-2024-009876',
          verificationStatus: 'pending',
          verifiedBy: null,
          verifiedAt: null,
          verificationNotes: 'Document verification in progress'
        },
        pdsDetails: {
          cardType: 'APL',
          familySize: 2,
          monthlyEntitlement: {
            rice: 5,
            wheat: 3,
            sugar: 1,
            kerosene: 3,
            pulses: 0
          },
          lastPurchaseDate: new Date('2024-11-30'),
          purchaseHistory: [
            {
              date: new Date('2024-11-30'),
              items: [
                { item: 'rice', quantity: 5, unit: 'kg' },
                { item: 'wheat', quantity: 3, unit: 'kg' },
                { item: 'sugar', quantity: 1, unit: 'kg' },
                { item: 'kerosene', quantity: 3, unit: 'liters' }
              ]
            }
          ],
          portabilityStatus: 'enabled',
          homeState: 'Karnataka',
          currentState: 'Karnataka'
        },
        proof: {
          type: 'Ed25519Signature2020',
          created: new Date(),
          verificationMethod: 'did:example:123456789abcdefghi#keys-1',
          proofPurpose: 'assertionMethod',
          proofValue: 'z58DDoFefrtUpHMLtiS4gUSr8VTVqE6BxHpGciFUqG8ETDruNsw4HnD9DqxFqkQJvePKDLNqwj6g6DG9WbKxTibGf'
        },
        status: 'active'
      },
      {
        type: 'RationCardVC',
        issuedBy: 'Food and Civil Supplies Department, Telangana',
        issuedAt: new Date('2023-06-20'),
        expiresAt: new Date('2024-06-20'),
        credentialSubject: {
          name: 'Lakshmi Devi',
          aadhaarNumber: '321098765432',
          address: '321 Village Road, Hyderabad, Telangana',
          phoneNumber: '+91-6543210987'
        },
        documentVerification: {
          documentHash: crypto.createHash('sha256').update('RationCard321098').digest('hex'),
          documentType: 'ration_card',
          documentNumber: 'RC-TS-2023-003456',
          verificationStatus: 'verified',
          verifiedBy: 'Food and Civil Supplies Department',
          verifiedAt: new Date('2023-07-01'),
          verificationNotes: 'Document verified through field verification'
        },
        pdsDetails: {
          cardType: 'BPL',
          familySize: 5,
          monthlyEntitlement: {
            rice: 35,
            wheat: 35,
            sugar: 1,
            kerosene: 3,
            pulses: 0
          },
          lastPurchaseDate: new Date('2024-11-20'),
          purchaseHistory: [
            {
              date: new Date('2024-11-20'),
              items: [
                { item: 'rice', quantity: 35, unit: 'kg' },
                { item: 'wheat', quantity: 35, unit: 'kg' },
                { item: 'sugar', quantity: 1, unit: 'kg' },
                { item: 'kerosene', quantity: 3, unit: 'liters' }
              ]
            }
          ],
          portabilityStatus: 'enabled',
          homeState: 'Telangana',
          currentState: 'Telangana'
        },
        proof: {
          type: 'Ed25519Signature2020',
          created: new Date(),
          verificationMethod: 'did:example:123456789abcdefghi#keys-1',
          proofPurpose: 'assertionMethod',
          proofValue: 'z58DDoFefrtUpHMLtiS4gUSr8VTVqE6BxHpGciFUqG8ETDruNsw4HnD9DqxFqkQJvePKDLNqwj6g6DG9WbKxTibGf'
        },
        status: 'expired'
      }
    ];

    for (const credential of sampleCredentials) {
      const newCredential = new VerifiableCredential(credential);
      await newCredential.save();
      console.log(`Created PDS credential for: ${credential.credentialSubject.name} (${credential.pdsDetails.cardType})`);
    }

    console.log('PDS credentials setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up PDS credentials:', error);
    process.exit(1);
  }
}

setupPDSCredentials(); 