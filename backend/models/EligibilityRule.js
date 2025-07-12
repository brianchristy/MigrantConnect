const mongoose = require('mongoose');

const EligibilityRuleSchema = new mongoose.Schema({
  serviceType: {
    type: String,
    required: true,
    enum: ['ration_portability', 'health_emergency', 'education_scholarship', 'skill_training']
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
      enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'exists']
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  }],
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