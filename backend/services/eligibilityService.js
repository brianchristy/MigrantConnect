const crypto = require('crypto');
const EligibilityRule = require('../models/EligibilityRule');
const VerificationLog = require('../models/VerificationLog');

class EligibilityService {
  constructor() {
    // Rules will be loaded from database
  }

  async getRules(serviceType, credentialType) {
    try {
      const EligibilityRule = require('../models/EligibilityRule');
      const rules = await EligibilityRule.find({
        serviceType,
        credentialType,
        isActive: true
      }).sort({ priority: 1 });
      
      return rules;
    } catch (error) {
      console.error('Error fetching rules:', error);
      return [];
    }
  }

  async evaluateEligibility(credential, serviceType, userId, verifierId, location) {
    try {
      // Find applicable rules from database
      const rules = await this.getRules(serviceType, credential.type);

      if (rules.length === 0) {
        return {
          eligible: false,
          reason: 'No eligibility rules found for this service and credential type',
          entitlement: null,
          documentVerification: null,
          warnings: []
        };
      }

      const warnings = [];
      const documentVerification = await this.verifyDocument(credential);

      // Check cooldown period for each rule
      for (const rule of rules) {
        if (rule.cooldownPeriod > 0) {
          const lastVerification = await VerificationLog.findOne({
            userId,
            serviceType,
            credentialType: credential.type
          }).sort({ timestamp: -1 });

          if (lastVerification) {
            const daysSinceLastVerification = (Date.now() - lastVerification.timestamp) / (1000 * 60 * 60 * 24);
            
            if (daysSinceLastVerification < rule.cooldownPeriod) {
              return {
                eligible: false,
                reason: `Cooldown period not met. Last verification was ${Math.ceil(daysSinceLastVerification)} days ago`,
                entitlement: null,
                documentVerification,
                warnings
              };
            }
          }
        }
      }

      // Check monthly usage limit for each rule
      for (const rule of rules) {
        if (rule.maxUsagePerMonth > 0) {
          const currentMonth = new Date();
          currentMonth.setDate(1);
          currentMonth.setHours(0, 0, 0, 0);

          const monthlyVerifications = await VerificationLog.countDocuments({
            userId,
            serviceType,
            credentialType: credential.type,
            timestamp: { $gte: currentMonth }
          });

          if (monthlyVerifications >= rule.maxUsagePerMonth) {
            return {
              eligible: false,
              reason: `Monthly usage limit exceeded (${rule.maxUsagePerMonth} per month)`,
              entitlement: null,
              documentVerification,
              warnings
            };
          }
        }
      }

      // Evaluate all rules
      for (const rule of rules) {
        const ruleResult = this.evaluateRule(credential, rule);
        if (!ruleResult.passed) {
          return {
            eligible: false,
            reason: `Failed rule: ${ruleResult.description}`,
            entitlement: null,
            documentVerification,
            warnings: [...warnings, ...ruleResult.warnings]
          };
        }
        warnings.push(...ruleResult.warnings);
      }

      // Calculate entitlements based on service type
      let entitlement = null;
      if (serviceType === 'pds_verification' || serviceType === 'ration_portability') {
        entitlement = this.calculatePDSEntitlement(credential, rules[0]);
      } else {
        // If all rules pass, use the first rule's entitlement
        const firstRule = rules[0];
        entitlement = firstRule.entitlement;
      }

      return {
        eligible: true,
        reason: 'All eligibility criteria met',
        entitlement,
        documentVerification,
        warnings
      };

    } catch (error) {
      console.error('Error evaluating eligibility:', error);
      return {
        eligible: false,
        reason: 'Error evaluating eligibility',
        entitlement: null,
        documentVerification: null,
        warnings: []
      };
    }
  }

  async verifyDocument(credential) {
    try {
      const verification = {
        isGenuine: false,
        verificationStatus: 'pending',
        issues: [],
        recommendations: []
      };

      // Check if document verification fields exist
      if (!credential.documentVerification) {
        verification.issues.push('Document verification data not found');
        return verification;
      }

      const docVer = credential.documentVerification;

      // Check document verification status
      if (docVer.verificationStatus === 'verified') {
        verification.isGenuine = true;
        verification.verificationStatus = 'verified';
      } else if (docVer.verificationStatus === 'rejected') {
        verification.issues.push('Document verification was rejected');
        verification.recommendations.push('Contact issuing authority for re-verification');
      } else {
        verification.issues.push('Document verification is pending');
        verification.recommendations.push('Complete document verification process');
      }

      // Check document expiration
      if (credential.expiresAt && new Date() > credential.expiresAt) {
        verification.issues.push('Document has expired');
        verification.recommendations.push('Renew document before using services');
      }

      // Check document hash integrity
      if (docVer.documentHash) {
        const expectedHash = this.generateDocumentHash(credential);
        if (docVer.documentHash !== expectedHash) {
          verification.issues.push('Document integrity check failed');
          verification.recommendations.push('Document may have been tampered with');
        }
      }

      return verification;
    } catch (error) {
      console.error('Error verifying document:', error);
      return {
        isGenuine: false,
        verificationStatus: 'error',
        issues: ['Error during document verification'],
        recommendations: ['Contact support']
      };
    }
  }

  generateDocumentHash(credential) {
    const data = JSON.stringify({
      type: credential.type,
      documentNumber: credential.documentVerification?.documentNumber,
      issuedAt: credential.issuedAt,
      credentialSubject: credential.credentialSubject
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  calculatePDSEntitlement(credential, rule) {
    try {
      if (!credential.pdsDetails || !rule.pdsConfig) {
        return 'Standard entitlement';
      }

      const cardType = credential.pdsDetails.cardType;
      const familySize = credential.pdsDetails.familySize || 1;
      
      // Handle both Map and regular object formats
      let entitlements;
      if (rule.pdsConfig.cardTypeEntitlements instanceof Map) {
        entitlements = rule.pdsConfig.cardTypeEntitlements.get(cardType);
      } else {
        entitlements = rule.pdsConfig.cardTypeEntitlements[cardType];
      }

      if (!entitlements) {
        return 'No entitlements for this card type';
      }

      const calculatedEntitlements = {};
      let totalValue = 0;

      // Handle both Map and regular object formats for entitlements
      const entries = entitlements instanceof Map ? entitlements.entries() : Object.entries(entitlements);
      
      for (const [item, config] of entries) {
        const quantity = config.quantity * familySize;
        const value = quantity * config.price;
        totalValue += value;

        calculatedEntitlements[item] = {
          quantity,
          unit: config.unit,
          price: config.price,
          totalPrice: value
        };
      }

      return {
        cardType,
        familySize,
        monthlyEntitlements: calculatedEntitlements,
        totalMonthlyValue: totalValue,
        portabilityStatus: credential.pdsDetails.portabilityStatus,
        homeState: credential.pdsDetails.homeState,
        currentState: credential.pdsDetails.currentState
      };
    } catch (error) {
      console.error('Error calculating PDS entitlement:', error);
      return 'Error calculating entitlements';
    }
  }

  evaluateRule(credential, rule) {
    const warnings = [];
    
    for (const ruleCondition of rule.rules) {
      const fieldValue = this.getNestedValue(credential, ruleCondition.field);
      const passed = this.evaluateCondition(fieldValue, ruleCondition.operator, ruleCondition.value);
      
      if (!passed) {
        if (ruleCondition.severity === 'warning') {
          warnings.push(ruleCondition.description);
        } else {
          return {
            passed: false,
            description: ruleCondition.description,
            warnings
          };
        }
      }
    }
    
    return {
      passed: true,
      description: 'All conditions met',
      warnings
    };
  }

  evaluateCondition(fieldValue, operator, expectedValue) {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'not_equals':
        return fieldValue !== expectedValue;
      case 'greater_than':
        return fieldValue > expectedValue;
      case 'less_than':
        return fieldValue < expectedValue;
      case 'contains':
        return fieldValue && fieldValue.includes(expectedValue);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'in_range':
        if (Array.isArray(expectedValue) && expectedValue.length === 2) {
          return fieldValue >= expectedValue[0] && fieldValue <= expectedValue[1];
        }
        return false;
      case 'date_valid':
        if (fieldValue) {
          const date = new Date(fieldValue);
          const now = new Date();
          const daysDiff = (now - date) / (1000 * 60 * 60 * 24);
          return daysDiff <= expectedValue;
        }
        return false;
      case 'document_verified':
        return fieldValue === 'verified';
      default:
        return false;
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // This method is no longer needed as entitlements are stored in rules
  determineEntitlement(credential, serviceType) {
    // Fallback method - should not be used in normal flow
    switch (serviceType) {
      case 'ration_portability':
        return credential.entitlement || '5kg/month';
      case 'health_emergency':
        return credential.coverage_amount || 'Up to ₹50,000';
      case 'education_scholarship':
        return credential.scholarship_amount || '₹10,000/year';
      default:
        return 'Standard entitlement';
    }
  }

  generateQRHash(credential, timestamp) {
    const data = JSON.stringify({
      type: credential.type,
      timestamp: timestamp,
      nonce: crypto.randomBytes(16).toString('hex')
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  async logVerification(userId, verifierId, serviceType, credentialType, result, consentGiven, location, qrHash, ipAddress, userAgent) {
    try {
      const log = new VerificationLog({
        userId,
        verifierId,
        serviceType,
        credentialType,
        verificationResult: result,
        consentGiven,
        location,
        qrHash,
        ipAddress,
        userAgent
      });

      await log.save();
      return log;
    } catch (error) {
      console.error('Error logging verification:', error);
      throw error;
    }
  }

  async checkQRReuse(qrHash) {
    try {
      const existingLog = await VerificationLog.findOne({ qrHash });
      return existingLog !== null;
    } catch (error) {
      console.error('Error checking QR reuse:', error);
      return false;
    }
  }
}

module.exports = new EligibilityService(); 