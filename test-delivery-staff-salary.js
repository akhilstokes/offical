const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const User = require('./server/models/userModel');
const Worker = require('./server/models/workerModel');
const SalaryRecord = require('./server/models/salaryModel');

async function testDeliveryStaffSalary() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a delivery staff user
    console.log('🔍 Finding delivery staff users...');
    const deliveryStaff = await User.find({ 
      role: { $in: ['delivery_staff', 'delivery', 'field_staff'] }
    }).limit(5);

    console.log(`Found ${deliveryStaff.length} delivery staff members:\n`);

    for (const staff of deliveryStaff) {
      console.log(`\n📋 Staff: ${staff.name} (${staff.email})`);
      console.log(`   Role: ${staff.role}`);
      console.log(`   ID: ${staff._id}`);

      // Check User model for daily rate
      const dailyRateFromUser = staff.dailySalary || staff.baseSalary || staff.dailyWage || 0;
      console.log(`   Daily Rate (User): ₹${dailyRateFromUser}`);

      // Check Worker model
      const worker = await Worker.findOne({ user: staff._id });
      if (worker) {
        console.log(`   ✅ Has Worker record`);
        console.log(`   Daily Wage (Worker): ₹${worker.dailyWage || 0}`);
        console.log(`   Monthly Salary (Worker): ₹${worker.monthlySalary || 0}`);
        console.log(`   Wage Type: ${worker.wageType}`);
      } else {
        console.log(`   ❌ No Worker record found`);
      }

      // Check salary records
      const salaryRecords = await SalaryRecord.find({ 
        staffMember: staff._id 
      }).sort({ year: -1, month: -1 }).limit(3);

      console.log(`   Salary Records: ${salaryRecords.length}`);
      if (salaryRecords.length > 0) {
        salaryRecords.forEach(record => {
          console.log(`     - ${record.month}/${record.year}: ₹${record.netSalary} (${record.status})`);
        });
      }

      // Simulate the API response
      let finalDailyRate = dailyRateFromUser;
      if (!finalDailyRate && worker) {
        finalDailyRate = worker.dailyWage || worker.monthlySalary || 0;
      }
      if (!finalDailyRate) {
        finalDailyRate = 500; // default
      }

      console.log(`   \n   🎯 Final Daily Rate: ₹${finalDailyRate}`);
      console.log(`   📊 API Response would be:`);
      console.log(`      {`);
      console.log(`        success: true,`);
      console.log(`        count: ${salaryRecords.length},`);
      console.log(`        dailyRate: ${finalDailyRate},`);
      console.log(`        data: [${salaryRecords.length} records]`);
      console.log(`      }`);
    }

    console.log('\n\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testDeliveryStaffSalary();
