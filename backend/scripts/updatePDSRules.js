const mongoose = require('mongoose');
const EligibilityRule = require('../models/EligibilityRule');
const config = require('../config/config');

async function updatePDSRules() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');

    // Update existing PDS rules
    const result = await EligibilityRule.updateMany(
      { serviceType: 'pds_verification' },
      { 
        $set: { 
          cooldownPeriod: 0,
          maxUsagePerMonth: -1
        } 
      }
    );

    console.log(`Updated ${result.modifiedCount} PDS rules`);
    console.log('PDS rules updated successfully - cooldown set to 0, unlimited monthly usage');
    
    // Verify the update
    const updatedRules = await EligibilityRule.find({ serviceType: 'pds_verification' });
    console.log('\nUpdated rules:');
    updatedRules.forEach(rule => {
      console.log(`- Cooldown: ${rule.cooldownPeriod} days`);
      console.log(`- Max usage per month: ${rule.maxUsagePerMonth === -1 ? 'Unlimited' : rule.maxUsagePerMonth}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error updating PDS rules:', error);
    process.exit(1);
  }
}

updatePDSRules(); 