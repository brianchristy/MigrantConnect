const mongoose = require('mongoose');

const VerificationLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  verifierId: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  credentialType: {
    type: String,
    required: true
  },
  verificationResult: {
    eligible: {
      type: Boolean,
      required: true
    },
    reason: String,
    entitlement: String
  },
  consentGiven: {
    type: Boolean,
    required: true
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  qrHash: {
    type: String,
    required: false
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
});

// Index for efficient querying
VerificationLogSchema.index({ userId: 1, timestamp: -1 });
VerificationLogSchema.index({ qrHash: 1 });

module.exports = mongoose.model('VerificationLog', VerificationLogSchema); 