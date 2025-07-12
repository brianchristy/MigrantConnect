const mongoose = require('mongoose');
const EligibilityRule = require('../models/EligibilityRule');
const VerifiableCredential = require('../models/VerifiableCredential');
const User = require('../models/User');
require('dotenv').config();

// Sample eligibility rules
const sampleRules = [
  {
    serviceType: 'ration_portability',
    credentialType: 'RationCardVC',
    rules: [
      {
        field: 'credentialSubject.ONORC_enabled',
        operator: 'equals',
        value: true,
        description: 'Card must be ONORC enabled'
      },
      {
        field: 'status',
        operator: 'equals',
        value: 'active',
        description: 'Card must be active'
      },
      {
        field: 'credentialSubject.last_claimed',
        operator: 'less_than',
        value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        description: 'Last claim must be more than 30 days ago'
      }
    ],
    cooldownPeriod: 30, // days
    maxUsagePerMonth: 1,
    entitlement: '5kg/month',
    description: 'Ration card portability under ONORC scheme'
  },
  {
    serviceType: 'health_emergency',
    credentialType: 'HealthCardVC',
    rules: [
      {
        field: 'credentialSubject.coverage_type',
        operator: 'contains',
        value: 'emergency',
        description: 'Must have emergency coverage'
      },
      {
        field: 'status',
        operator: 'equals',
        value: 'active',
        description: 'Card must be active'
      },
      {
        field: 'credentialSubject.valid_until',
        operator: 'greater_than',
        value: new Date(),
        description: 'Card must be valid'
      }
    ],
    cooldownPeriod: 0, // no cooldown for emergencies
    maxUsagePerMonth: -1, // unlimited
    entitlement: 'Up to ₹50,000',
    description: 'Emergency health services coverage'
  },
  {
    serviceType: 'education_scholarship',
    credentialType: 'EducationCardVC',
    rules: [
      {
        field: 'status',
        operator: 'equals',
        value: 'active',
        description: 'Card must be active'
      },
      {
        field: 'credentialSubject.education_level',
        operator: 'equals',
        value: 'secondary',
        description: 'Must be secondary education level'
      },
      {
        field: 'credentialSubject.institution_type',
        operator: 'equals',
        value: 'government',
        description: 'Must be government institution'
      }
    ],
    cooldownPeriod: 365, // once per year
    maxUsagePerMonth: 1,
    entitlement: '₹10,000/year',
    description: 'Educational scholarship for government schools'
  },
  {
    serviceType: 'skill_training',
    credentialType: 'SkillCertVC',
    rules: [
      {
        field: 'status',
        operator: 'equals',
        value: 'active',
        description: 'Certificate must be active'
      },
      {
        field: 'credentialSubject.skill_level',
        operator: 'equals',
        value: 'basic',
        description: 'Must have basic skill level'
      }
    ],
    cooldownPeriod: 180, // 6 months
    maxUsagePerMonth: 2,
    entitlement: 'Free skill training program',
    description: 'Skill development training programs'
  }
];

// Sample verifiable credentials
const sampleCredentials = [
  {
    type: 'RationCardVC',
    issuedBy: 'FoodDept_Bihar',
    issuedAt: new Date('2024-01-15T10:00:00Z'),
    expiresAt: new Date('2025-12-31T23:59:59Z'),
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
    status: 'active',
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date('2024-01-15T10:00:00Z'),
      verificationMethod: 'did:example:123#key-1',
      proofPurpose: 'assertionMethod',
      proofValue: 'sample-proof-value-1'
    }
  },
  {
    type: 'HealthCardVC',
    issuedBy: 'HealthDept_Bihar',
    issuedAt: new Date('2024-03-20T14:30:00Z'),
    expiresAt: new Date('2025-03-20T14:30:00Z'),
    credentialSubject: {
      userId: 'user123',
      coverage_type: 'emergency_health',
      coverage_amount: 'Up to ₹50,000',
      valid_until: new Date('2025-03-20T14:30:00Z'),
      hospital_network: ['AIIMS', 'PMCH', 'Private Hospitals'],
      card_number: 'HEALTH987654321',
      beneficiary_name: 'Rahul Kumar',
      emergency_contact: '+91-9876543210'
    },
    status: 'active',
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date('2024-03-20T14:30:00Z'),
      verificationMethod: 'did:example:123#key-2',
      proofPurpose: 'assertionMethod',
      proofValue: 'sample-proof-value-2'
    }
  },
  {
    type: 'EducationCardVC',
    issuedBy: 'EducationDept_Bihar',
    issuedAt: new Date('2024-02-10T09:15:00Z'),
    expiresAt: new Date('2025-02-10T09:15:00Z'),
    credentialSubject: {
      userId: 'user123',
      scholarship_amount: '₹10,000/year',
      education_level: 'secondary',
      institution_type: 'government',
      academic_year: '2024-25',
      card_number: 'EDU456789123',
      student_name: 'Rahul Kumar',
      school_name: 'Government High School, Patna'
    },
    status: 'active',
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date('2024-02-10T09:15:00Z'),
      verificationMethod: 'did:example:123#key-3',
      proofPurpose: 'assertionMethod',
      proofValue: 'sample-proof-value-3'
    }
  },
  {
    type: 'SkillCertVC',
    issuedBy: 'SkillDept_Bihar',
    issuedAt: new Date('2024-04-05T11:20:00Z'),
    expiresAt: new Date('2026-04-05T11:20:00Z'),
    credentialSubject: {
      userId: 'user123',
      skill_name: 'Basic Computer Skills',
      skill_level: 'basic',
      training_center: 'Bihar Skill Development Center',
      certificate_number: 'SKILL789456123',
      holder_name: 'Rahul Kumar',
      completion_date: '2024-03-15'
    },
    status: 'active',
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date('2024-04-05T11:20:00Z'),
      verificationMethod: 'did:example:123#key-4',
      proofPurpose: 'assertionMethod',
      proofValue: 'sample-proof-value-4'
    }
  }
];

async function setupData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await EligibilityRule.deleteMany({});
    await VerifiableCredential.deleteMany({});
    console.log('Cleared existing data');

    // Insert eligibility rules
    const insertedRules = await EligibilityRule.insertMany(sampleRules);
    console.log(`Inserted ${insertedRules.length} eligibility rules`);

    // Insert verifiable credentials
    const insertedCredentials = await VerifiableCredential.insertMany(sampleCredentials);
    console.log(`Inserted ${insertedCredentials.length} verifiable credentials`);

    console.log('Data setup completed successfully!');
    
    // Display summary
    console.log('\n=== Setup Summary ===');
    console.log('Eligibility Rules:');
    insertedRules.forEach(rule => {
      console.log(`- ${rule.serviceType} (${rule.credentialType}): ${rule.description}`);
    });
    
    console.log('\nVerifiable Credentials:');
    insertedCredentials.forEach(cred => {
      console.log(`- ${cred.type}: ${cred.credentialSubject.beneficiary_name || cred.credentialSubject.holder_name || 'Unknown'}`);
    });

  } catch (error) {
    console.error('Error setting up data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupData();
}

module.exports = setupData; 