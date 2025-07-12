const mongoose = require('mongoose');

const EligibilityRuleSchema = new mongoose.Schema({
  serviceType: {
    type: String,
    required: true,
    enum: ['ration_portability', 'health_emergency', 'education_scholarship', 'skill_training', 'pds_verification']
  },
  credentialType: {
    type: String,
    required: true,
    enum: ['RationCardVC', 'HealthCardVC', 'EducationCardVC', 'SkillCertVC']
  },
  rules: [{
    field: {
      type: String,
      required: true
    },
    operator: {
      type: String,
      required: true,
      enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'exists', 'in_range', 'date_valid', 'document_verified']
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['critical', 'warning', 'info'],
      default: 'critical'
    }
  }],
  // PDS-specific configuration
  pdsConfig: {
    cardTypeEntitlements: {
      type: Map,
      of: {
        type: Map,
        of: {
          quantity: { type: Number, default: 0 },
          unit: { type: String, default: 'kg' },
          price: { type: Number, default: 0 }
        }
      }
    },
    portabilityRules: {
      enabledStates: [{ type: String }],
      maxPortabilityDays: { type: Number, default: 30 },
      requireLocalVerification: { type: Boolean, default: true }
    },
    verificationRequirements: {
      requireDocumentVerification: { type: Boolean, default: true },
      requireBiometricVerification: { type: Boolean, default: false },
      requireAddressVerification: { type: Boolean, default: true },
      maxVerificationAge: { type: Number, default: 90 } // days
    }
  },
  cooldownPeriod: {
    type: Number,
    default: 0,
    description: 'Cooldown period in days between verifications'
  },
  maxUsagePerMonth: {
    type: Number,
    default: -1,
    description: 'Maximum usage per month (-1 for unlimited)'
  },
  entitlement: {
    type: String,
    required: true,
    description: 'What the user is entitled to receive'
  },
  description: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 1,
    description: 'Priority order for rule evaluation'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
EligibilityRuleSchema.index({ serviceType: 1, credentialType: 1 });
EligibilityRuleSchema.index({ isActive: 1 });

module.exports = mongoose.model('EligibilityRule', EligibilityRuleSchema); 