const express = require('express');
const router = express.Router();
const eligibilityService = require('../services/eligibilityService');
const crypto = require('crypto');

// POST /api/verify-eligibility
router.post('/verify-eligibility', async (req, res) => {
  try {
    const {
      vc,
      service,
      verifierId,
      consentGiven,
      location,
      qrHash
    } = req.body;

    // Validate required fields
    if (!vc || !service || !verifierId || consentGiven === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: vc, service, verifierId, consentGiven'
      });
    }

    // Check if consent was given
    if (!consentGiven) {
      return res.status(403).json({
        success: false,
        message: 'Verification denied - user consent not given'
      });
    }

    // Check for QR reuse
    if (qrHash) {
      const isReused = await eligibilityService.checkQRReuse(qrHash);
      if (isReused) {
        return res.status(400).json({
          success: false,
          message: 'QR code has already been used'
        });
      }
    }

    // Extract user ID from credential (in real implementation, this would be verified)
    const userId = vc.userId || 'mock-user-id';

    // Evaluate eligibility
    const result = await eligibilityService.evaluateEligibility(
      vc,
      service,
      userId,
      verifierId,
      location
    );

    // Log the verification
    await eligibilityService.logVerification(
      userId,
      verifierId,
      service,
      vc.type,
      result,
      consentGiven,
      location,
      qrHash,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      eligible: result.eligible,
      entitlement: result.entitlement,
      reason: result.reason,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during verification'
    });
  }
});

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