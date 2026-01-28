const mongoose = require('mongoose');
require('dotenv').config();

const Bill = require('./models/billModel');
const User = require('./models/userModel');

async function fixBillUserLinks() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all bills without userId
    const billsWithoutUserId = await Bill.find({ 
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });

    console.log(`📋 Found ${billsWithoutUserId.length} bills without userId\n`);

    let fixed = 0;
    let notFound = 0;

    for (const bill of billsWithoutUserId) {
      console.log(`Processing: ${bill.billNumber} - ${bill.customerName} (${bill.customerPhone})`);
      
      // Try to find user by phone number
      let user = null;
      
      if (bill.customerPhone && bill.customerPhone !== 'N/A') {
        user = await User.findOne({ 
          phoneNumber: bill.customerPhone,
          role: 'user'
        });
      }
      
      // If not found by phone, try by name (case insensitive)
      if (!user && bill.customerName) {
        user = await User.findOne({ 
          name: new RegExp(`^${bill.customerName}$`, 'i'),
          role: 'user'
        });
      }
      
      if (user) {
        bill.userId = user._id;
        await bill.save();
        console.log(`  ✅ Linked to user: ${user.name} (${user._id})`);
        fixed++;
      } else {
        console.log(`  ⚠️  No matching user found`);
        notFound++;
      }
      console.log('');
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Fixed: ${fixed} bills`);
    console.log(`  ⚠️  Not found: ${notFound} bills`);
    
    if (notFound > 0) {
      console.log('\n💡 Tip: Create user accounts for these customers or update their phone numbers');
    }

    mongoose.connection.close();
    console.log('\n✅ Fix complete');
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

fixBillUserLinks();
