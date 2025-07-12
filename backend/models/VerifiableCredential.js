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

module.exports = mongoose.model('VerifiableCredential', VerifiableCredentialSchema); 