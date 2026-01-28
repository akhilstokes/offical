const mongoose = require('mongoose');
require('dotenv').config();

const Bill = require('./models/billModel');
const User = require('./models/userModel');

async function checkTeenaBills() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Teena's user account
    const teenaUser = await User.findOne({ 
      $or: [
        { name: /teena/i },
        { email: /teena/i }
      ]
    });

    if (!teenaUser) {
      console.log('❌ Teena user not found!');
      mongoose.connection.close();
      return;
    }

    console.log('👤 Teena User Found:');
    console.log(`   Name: ${teenaUser.name}`);
    console.log(`   Email: ${teenaUser.email}`);
    console.log(`   Phone: ${teenaUser.phoneNumber || 'N/A'}`);
    console.log(`   User ID: ${teenaUser._id}`);
    console.log(`   Role: ${teenaUser.role}`);
    console.log('');

    // Find all bills for Teena by name
    const billsByName = await Bill.find({ 
      customerName: /teena/i 
    });
    console.log(`📋 Bills with "teena" in customerName: ${billsByName.length}`);
    billsByName.forEach(bill => {
      console.log(`   - ${bill.billNumber}`);
      console.log(`     Customer: ${bill.customerName}`);
      console.log(`     Phone: ${bill.customerPhone}`);
      console.log(`     UserId: ${bill.userId || '❌ MISSING'}`);
      console.log(`     Status: ${bill.status}`);
      console.log(`     Created: ${bill.createdAt}`);
      console.log('');
    });

    // Find bills linked to Teena's userId
    const billsByUserId = await Bill.find({ 
      userId: teenaUser._id 
    });
    console.log(`📋 Bills linked to Teena's userId: ${billsByUserId.length}`);
    billsByUserId.forEach(bill => {
      console.log(`   - ${bill.billNumber} (${bill.status})`);
    });
    console.log('');

    // Check what query the frontend uses
    console.log('🔍 Testing Frontend Query:');
    const frontendQuery = { 
      userId: teenaUser._id,
      status: { $in: ['manager_verified', 'approved', 'paid'] }
    };
    console.log('Query:', JSON.stringify(frontendQuery, null, 2));
    
    const frontendBills = await Bill.find(frontendQuery);
    console.log(`Results: ${frontendBills.length} bills`);
    frontendBills.forEach(bill => {
      console.log(`   - ${bill.billNumber}`);
      console.log(`     Status: ${bill.status}`);
      console.log(`     Amount: ₹${bill.totalAmount}`);
      console.log('');
    });

    // Check all manager_verified bills
    console.log('📊 All Manager Verified Bills:');
    const verifiedBills = await Bill.find({ status: 'manager_verified' })
      .populate('userId', 'name email');
    verifiedBills.forEach(bill => {
      console.log(`   - ${bill.billNumber}`);
      console.log(`     Customer Name: ${bill.customerName}`);
      console.log(`     Linked User: ${bill.userId?.name || 'NOT LINKED'}`);
      console.log(`     User ID: ${bill.userId?._id || 'MISSING'}`);
      console.log('');
    });

    mongoose.connection.close();
    console.log('✅ Check complete');
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

checkTeenaBills();
