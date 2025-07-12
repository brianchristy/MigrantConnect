require('dotenv').config();

const config = {
  // Database Configuration
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/migrantconnect',
  
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Security Configuration
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  
  // API Configuration
  apiVersion: process.env.API_VERSION || 'v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Logging Configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // QR Code Configuration
  qrExpiryMinutes: parseInt(process.env.QR_EXPIRY_MINUTES) || 15,
  
  // Verification Configuration
  maxVerificationsPerMonth: parseInt(process.env.MAX_VERIFICATIONS_PER_MONTH) || 10,
  defaultCooldownDays: parseInt(process.env.DEFAULT_COOLDOWN_DAYS) || 30,
  
  // Location Configuration
  locationEnabled: process.env.LOCATION_ENABLED === 'true',
  maxLocationAccuracy: parseInt(process.env.MAX_LOCATION_ACCURACY) || 100,
  
  // Audit Configuration
  auditLogEnabled: process.env.AUDIT_LOG_ENABLED !== 'false',
  auditLogRetentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS) || 365,
  
  // Eligibility Rules Configuration
  eligibilityRules: {
    ration_portability: {
      cooldownPeriod: 30,
      maxUsagePerMonth: 1,
      rules: [
        {
          field: 'credentialSubject.ONORC_enabled',
          operator: 'equals',
          value: true,
          description: 'Card must be ONORC enabled'
        },
        {
          field: 'credentialSubject.last_claimed',
          operator: 'less_than',
          value: '30_days_ago',
          description: 'Last claim must be more than 30 days ago'
        }
      ]
    },
    health_emergency: {
      cooldownPeriod: 0,
      maxUsagePerMonth: -1, // Unlimited
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
        }
      ]
    },
    education_scholarship: {
      cooldownPeriod: 0,
      maxUsagePerMonth: 12,
      rules: [
        {
          field: 'status',
          operator: 'equals',
          value: 'active',
          description: 'Card must be active'
        },
        {
          field: 'credentialSubject.academic_year',
          operator: 'equals',
          value: '2024-25',
          description: 'Must be current academic year'
        }
      ]
    },
    skill_training: {
      cooldownPeriod: 7,
      maxUsagePerMonth: 2,
      rules: [
        {
          field: 'status',
          operator: 'equals',
          value: 'active',
          description: 'Certificate must be active'
        }
      ]
    }
  }
};

module.exports = config; 