const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const Bill = require('./server/models/billModel');
const User = require('./server/models/userModel');

async function debugCustomerBills() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Check all bills
    const allBills = await Bill.find({}).select('billNumber customerName userId status createdAt');
    console.log('📊 Total Bills in Database:', allBills.length);
    console.log('\n--- All Bills ---');
    allBills.forEach(bill => {
      console.log(`Bill: ${bill.billNumber}`);
      console.log(`  Customer: ${bill.customerName}`);
      console.log(`  UserId: ${bill.userId || 'NOT SET'}`);
      console.log(`  Status: ${bill.status}`);
      console.log(`  Date: ${bill.createdAt}`);
      console.log('');
    });

    // 2. Check bills with userId
    const billsWithUserId = await Bill.find({ userId: { $exists: true, $ne: null } });
    console.log('\n📋 Bills WITH userId:', billsWithUserId.length);

    // 3. Check bills without userId
    const billsWithoutUserId = await Bill.find({ 
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });
    console.log('⚠️  Bills WITHOUT userId:', billsWithoutUserId.length);
    if (billsWithoutUserId.length > 0) {
      console.log('\nBills missing userId:');
      billsWithoutUserId.forEach(bill => {
        console.log(`  - ${bill.billNumber} (${bill.customerName})`);
      });
    }

    // 4. Check manager_verified bills
    const verifiedBills = await Bill.find({ status: 'manager_verified' });
    console.log('\n✅ Manager Verified Bills:', verifiedBills.length);
    verifiedBills.forEach(bill => {
      console.log(`  - ${bill.billNumber}: userId = ${bill.userId || 'MISSING'}`);
    });

    // 5. Check all users (customers)
    const customers = await User.find({ role: 'user' }).select('name email phoneNumber');
    console.log('\n👥 Total Customers:', customers.length);
    customers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Phone: ${user.phoneNumber || 'N/A'}`);
      console.log(`    ID: ${user._id}`);
    });

    // 6. Test query that frontend uses
    console.log('\n🔍 Testing Frontend Query...');
    const testUserId = customers[0]?._id;
    if (testUserId) {
      console.log(`Testing with userId: ${testUserId}`);
      const userBills = await Bill.find({ 
        userId: testUserId,
        status: { $in: ['manager_verified', 'approved', 'paid'] }
      });
      console.log(`Bills found for this user: ${userBills.length}`);
    }

    // 7. Check for phone number matches
    console.log('\n📞 Checking Phone Number Matches...');
    for (const customer of customers) {
      if (customer.phoneNumber) {
        const matchingBills = await Bill.find({ 
          customerPhone: customer.phoneNumber 
        });
        if (matchingBills.length > 0) {
          console.log(`\n✅ Customer: ${customer.name} (${customer.phoneNumber})`);
          console.log(`   User ID: ${customer._id}`);
          console.log(`   Matching Bills: ${matchingBills.length}`);
          matchingBills.forEach(bill => {
            console.log(`     - ${bill.billNumber}: userId = ${bill.userId || '❌ MISSING'}, status = ${bill.status}`);
          });
        }
      }
    }

    mongoose.connection.close();
    console.log('\n✅ Diagnosis complete');
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

debugCustomerBills();
