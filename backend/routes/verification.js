const express = require('express');
const router = express.Router();
const VerifiableCredential = require('../models/VerifiableCredential');
const eligibilityService = require('../services/eligibilityService');
const crypto = require('crypto');

// POST /api/verify-eligibility
router.post('/verify-eligibility', async (req, res) => {
  try {
    const { qrPayload, verifierId, location, consentGiven } = req.body;

    // 1. Parse QR payload
    // Example: { credentialId, serviceType, nonce, ... }
    const { credentialId, serviceType } = qrPayload;

    // 2. Load credential
    const credential = await VerifiableCredential.findById(credentialId);
    if (!credential) {
      return res.status(404).json({ success: false, reason: 'Credential not found' });
    }

    const userId = credential.credentialSubject?.aadhaarNumber || credential.credentialSubject?.id || 'unknown';

    // 3. Run eligibility and document checks
    const result = await eligibilityService.evaluateEligibility(
      credential,
      serviceType,
      userId,
      verifierId,
      location
    );

    // 4. Log the verification
    const qrHash = qrPayload.nonce || crypto.randomBytes(16).toString('hex');
    await eligibilityService.logVerification(
      userId,
      verifierId,
      serviceType,
      credential.type,
      result,
      consentGiven,
      location,
      qrHash,
      req.ip,
      req.get('User-Agent')
    );

    // 5. Get service details for the response
    const serviceDetails = getServiceDetails(serviceType);

    // 6. Return detailed result with service information
    return res.json({
      success: true,
      ...result,
      serviceDetails,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Eligibility verification error:', err);
    res.status(500).json({ success: false, reason: 'Internal server error' });
  }
});

// Helper function to get service details
function getServiceDetails(serviceType) {
  const services = {
    'pds_verification': {
      name: 'PDS Verification',
      description: 'Public Distribution System verification for ration card portability',
      icon: '🛒',
      benefits: [
        'Access to subsidized food grains',
        'Portability across states under ONORC',
        'Monthly entitlements based on family size'
      ]
    },
    'ration_portability': {
      name: 'Ration Portability',
      description: 'One Nation One Ration Card (ONORC) verification',
      icon: '🆔',
      benefits: [
        'Access to ration benefits in any state',
        'No need for new ration card',
        'Seamless portability of benefits'
      ]
    },
    'health_emergency': {
      name: 'Health Emergency',
      description: 'Emergency healthcare service verification',
      icon: '🏥',
      benefits: [
        'Emergency medical treatment',
        'Up to ₹50,000 coverage',
        'Cashless treatment at empaneled hospitals'
      ]
    },
    'education_scholarship': {
      name: 'Education Scholarship',
      description: 'Educational scholarship and fee reimbursement',
      icon: '🎓',
      benefits: [
        'Tuition fee reimbursement',
        'Book and uniform allowance',
        'Transportation allowance'
      ]
    },
    'skill_training': {
      name: 'Skill Training',
      description: 'Skill development and training programs',
      icon: '🔧',
      benefits: [
        'Free skill training courses',
        'Certification programs',
        'Job placement assistance'
      ]
    }
  };

  return services[serviceType] || {
    name: serviceType,
    description: 'Service verification',
    icon: '✅',
    benefits: ['Service verification completed']
  };
}

// GET /api/verification-history/:userId
router.get('/verification-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const VerificationLog = require('../models/VerificationLog');
    const logs = await VerificationLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-__v');

    res.json({
      success: true,
      logs,
      total: logs.length
    });

  } catch (error) {
    console.error('Error fetching verification history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verification history'
    });
  }
});

// POST /api/generate-qr
router.post('/generate-qr', async (req, res) => {
  try {
    const { credential, expiryMinutes = 15 } = req.body;

    if (!credential || !credential.type) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credential data'
      });
    }

    // Create QR payload
    const validUntil = new Date(Date.now() + expiryMinutes * 60 * 1000);
    const qrPayload = {
      vc_type: credential.type,
      encrypted_payload: Buffer.from(JSON.stringify(credential)).toString('base64'),
      valid_until: validUntil.toISOString(),
      nonce: crypto.randomBytes(16).toString('hex')
    };

    // Generate QR hash for tracking
    const qrHash = eligibilityService.generateQRHash(credential, Date.now());

    res.json({
      success: true,
      qrPayload,
      qrHash,
      validUntil: validUntil.toISOString()
    });

  } catch (error) {
    console.error('Error generating QR:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating QR code'
    });
  }
});

// GET /api/available-services
router.get('/available-services', (req, res) => {
  const services = [
    {
      id: 'ration_portability',
      name: 'Ration Portability',
      description: 'Verify eligibility for ration card portability under ONORC',
      credentialTypes: ['RationCardVC']
    },
    {
      id: 'health_emergency',
      name: 'Health Emergency',
      description: 'Verify eligibility for emergency health services',
      credentialTypes: ['HealthCardVC']
    },
    {
      id: 'education_scholarship',
      name: 'Education Scholarship',
      description: 'Verify eligibility for educational scholarships',
      credentialTypes: ['EducationCardVC']
    },
    {
      id: 'skill_training',
      name: 'Skill Training',
      description: 'Verify eligibility for skill development programs',
      credentialTypes: ['SkillCertVC']
    }
  ];

  res.json({
    success: true,
    services
  });
});

module.exports = router; 