const mongoose = require('mongoose');

const VerifiableCredentialSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['RationCardVC', 'HealthCardVC', 'EducationCardVC', 'SkillCertVC']
  },
  issuedBy: {
    type: String,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  credentialSubject: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  // Document verification fields
  documentVerification: {
    documentHash: {
      type: String,
      required: true,
      description: 'SHA256 hash of the original document'
    },
    documentType: {
      type: String,
      required: true,
      enum: ['ration_card', 'aadhaar', 'pan_card', 'voter_id', 'driving_license']
    },
    documentNumber: {
      type: String,
      required: true
    },
    verificationStatus: {
      type: String,
      enum: ['verified', 'pending', 'rejected'],
      default: 'pending'
    },
    verifiedBy: {
      type: String,
      description: 'Authority that verified the document'
    },
    verifiedAt: {
      type: Date
    },
    verificationNotes: {
      type: String
    }
  },
  // PDS-specific fields for ration cards
  pdsDetails: {
    cardType: {
      type: String,
      enum: ['APL', 'BPL', 'AAY', 'NPHH'],
      description: 'Above Poverty Line, Below Poverty Line, Antyodaya Anna Yojana, Non-Priority Household'
    },
    familySize: {
      type: Number,
      min: 1,
      max: 10
    },
    monthlyEntitlement: {
      rice: { type: Number, default: 0 }, // in kg
      wheat: { type: Number, default: 0 }, // in kg
      sugar: { type: Number, default: 0 }, // in kg
      kerosene: { type: Number, default: 0 }, // in liters
      pulses: { type: Number, default: 0 } // in kg
    },
    lastPurchaseDate: {
      type: Date
    },
    purchaseHistory: [{
      date: { type: Date },
      items: [{
        item: { type: String },
        quantity: { type: Number },
        unit: { type: String }
      }]
    }],
    portabilityStatus: {
      type: String,
      enum: ['enabled', 'disabled'],
      default: 'enabled'
    },
    homeState: {
      type: String,
      required: function() {
        return this.type === 'RationCardVC';
      }
    },
    currentState: {
      type: String,
      required: function() {
        return this.type === 'RationCardVC';
      }
    }
  },
  proof: {
    type: {
      type: String,
      default: 'Ed25519Signature2020'
    },
    created: {
      type: Date,
      default: Date.now
    },
    verificationMethod: String,
    proofPurpose: {
      type: String,
      default: 'assertionMethod'
    },
    proofValue: String
  },
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
VerifiableCredentialSchema.index({ 'documentVerification.documentNumber': 1 });
VerifiableCredentialSchema.index({ 'pdsDetails.cardType': 1 });
VerifiableCredentialSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('VerifiableCredential', VerifiableCredentialSchema); 