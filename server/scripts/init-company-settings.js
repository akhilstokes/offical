const mongoose = require('mongoose');
const CompanySettings = require('../models/companySettingsModel');
require('dotenv').config({ path: '../.env' });

const initCompanySettings = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/holyfamily');
    console.log('✅ Connected to MongoDB');

    // Check if company settings already exist
    const existing = await CompanySettings.findOne();
    
    if (existing) {
      console.log('ℹ️  Company settings already exist:');
      console.log(JSON.stringify(existing, null, 2));
      console.log('\n✅ No changes needed');
    } else {
      // Create default company settings
      const companySettings = await CompanySettings.create({
        companyName: 'Holy Family Polymers',
        address: 'Kooroppada, P.O. - 686 502',
        city: 'Kooroppada',
        state: 'Kerala',
        pincode: '686502',
        country: 'India',
        phone: '+91 9876543210',
        email: 'info@holyfamilypolymers.com',
        website: 'www.holyfamilypolymers.com',
        gstNumber: '32AAHFH5388M1ZX',
        panNumber: 'AAHFH5388M',
        registrationNumber: 'M142389',
        logoUrl: '/images/company-logo.png',
        bankName: 'State Bank of India',
        accountNumber: '1234567890',
        ifscCode: 'SBIN0001234',
        accountHolderName: 'Holy Family Polymers',
        billPrefix: 'BILL',
        billFooterText: 'This is a computer-generated bill.',
        termsAndConditions: '1. Payment should be made within 30 days.\n2. Goods once sold will not be taken back.\n3. Subject to Kooroppada jurisdiction.'
      });

      console.log('✅ Company settings created successfully:');
      console.log(JSON.stringify(companySettings, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

initCompanySettings();
