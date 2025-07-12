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
          entitlement: null
        };
      }

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
                entitlement: null
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
              entitlement: null
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
            entitlement: null
          };
        }
      }

      // If all rules pass, use the first rule's entitlement
      const firstRule = rules[0];
      const entitlement = firstRule.entitlement;

      return {
        eligible: true,
        reason: 'All eligibility criteria met',
        entitlement
      };

    } catch (error) {
      console.error('Error evaluating eligibility:', error);
      return {
        eligible: false,
        reason: 'Error evaluating eligibility',
        entitlement: null
      };
    }
  }

  evaluateRule(credential, rule) {
    for (const ruleCondition of rule.rules) {
      const fieldValue = this.getNestedValue(credential, ruleCondition.field);
      const passed = this.evaluateCondition(fieldValue, ruleCondition.operator, ruleCondition.value);
      
      if (!passed) {
        return {
          passed: false,
          description: ruleCondition.description
        };
      }
    }
    
    return {
      passed: true,
      description: 'All conditions met'
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