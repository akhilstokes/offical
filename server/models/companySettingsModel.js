const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema({
  // Company Information
  companyName: {
    type: String,
    required: true,
    default: 'Holy Family Polymers'
  },
  
  // Address Details
  address: {
    type: String,
    required: true,
    default: 'Kooroppada, P.O. - 686 502'
  },
  
  city: {
    type: String,
    default: 'Kooroppada'
  },
  
  state: {
    type: String,
    default: 'Kerala'
  },
  
  pincode: {
    type: String,
    default: '686502'
  },
  
  country: {
    type: String,
    default: 'India'
  },
  
  // Contact Information
  phone: {
    type: String,
    default: '+91 9876543210'
  },
  
  email: {
    type: String,
    default: 'info@holyfamilypolymers.com'
  },
  
  website: {
    type: String,
    default: 'www.holyfamilypolymers.com'
  },
  
  // Legal Information
  gstNumber: {
    type: String,
    required: true,
    default: '32AAHFH5388M1ZX'
  },
  
  panNumber: {
    type: String,
    default: 'AAHFH5388M'
  },
  
  registrationNumber: {
    type: String,
    default: 'M142389'
  },
  
  // Logo
  logoUrl: {
    type: String,
    default: '/images/company-logo.png'
  },
  
  // Bank Details (for bills)
  bankName: {
    type: String,
    default: 'State Bank of India'
  },
  
  accountNumber: {
    type: String,
    default: '1234567890'
  },
  
  ifscCode: {
    type: String,
    default: 'SBIN0001234'
  },
  
  accountHolderName: {
    type: String,
    default: 'Holy Family Polymers'
  },
  
  // Bill Settings
  billPrefix: {
    type: String,
    default: 'BILL'
  },
  
  billFooterText: {
    type: String,
    default: 'This is a computer-generated bill.'
  },
  
  termsAndConditions: {
    type: String,
    default: '1. Payment should be made within 30 days.\n2. Goods once sold will not be taken back.\n3. Subject to Kooroppada jurisdiction.'
  },
  
  // Singleton pattern - only one company settings document
  isSingleton: {
    type: Boolean,
    default: true,
    unique: true
  }
  
}, { timestamps: true });

// Ensure only one company settings document exists
companySettingsSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    if (count > 0) {
      const error = new Error('Only one company settings document is allowed');
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('CompanySettings', companySettingsSchema);
