const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const rateSchema = new mongoose.Schema({
  product: String,
  marketRate: Number,
  companyRate: Number,
  effectiveDate: Date,
  status: String,
  source: String,
  notes: String,
  createdBy: mongoose.Schema.Types.ObjectId,
  updatedBy: mongoose.Schema.Types.ObjectId,
  verifiedBy: mongoose.Schema.Types.ObjectId,
  verifiedAt: Date
}, { timestamps: true });

const Rate = mongoose.model('Rate', rateSchema);

async function checkRates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const rates = await Rate.find({}).sort({ createdAt: -1 }).limit(10);
    
    console.log('\nRecent rates:');
    rates.forEach(rate => {
      console.log(`\nID: ${rate._id}`);
      console.log(`Product: ${rate.product}`);
      console.log(`Status: ${rate.status}`);
      console.log(`Market Rate: ${rate.marketRate}`);
      console.log(`Company Rate: ${rate.companyRate}`);
      console.log(`Created: ${rate.createdAt}`);
    });
    
    const pendingCount = await Rate.countDocuments({ status: 'pending' });
    console.log(`\n\nTotal pending rates: ${pendingCount}`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkRates();
