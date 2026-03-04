const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/userModel');
const SalarySummary = require('./models/salarySummaryModel');
const Salary = require('./models/salaryModel');

async function testWageCreation() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get a staff member
    const staff = await User.findOne({ role: 'field_staff' });
    if (!staff) {
      console.log('❌ No staff member found');
      process.exit(1);
    }

    console.log(`\n📋 Testing wage creation for: ${staff.name} (${staff._id})`);

    const testData = {
      staffId: staff._id.toString(),
      dailyRate: 500,
      date: new Date().toISOString().split('T')[0]
    };

    console.log('\n📝 Test Data:', testData);

    // Parse the date
    const wageDate = new Date(testData.date);
    const year = wageDate.getFullYear();
    const month = wageDate.getMonth() + 1;

    console.log(`\n📅 Year: ${year}, Month: ${month}`);

    // Check existing wage
    const existing = await SalarySummary.findOne({
      staff: testData.staffId,
      year: year,
      month: month
    });

    console.log('\n🔍 Existing wage entry:', existing ? 'Found' : 'Not found');

    if (existing) {
      console.log('   Current dailyWage:', existing.dailyWage);
      console.log('   Current workingDays:', existing.workingDays);
    }

    // Try to create/update
    let wage;
    if (existing) {
      existing.dailyWage = (existing.dailyWage || 0) + Number(testData.dailyRate);
      existing.workingDays = (existing.workingDays || 0) + 1;
      existing.baseSalary = existing.dailyWage;
      existing.grossSalary = existing.dailyWage;
      existing.netSalary = existing.dailyWage;
      existing.status = 'calculated';
      existing.calculatedAt = new Date();
      
      wage = await existing.save();
      console.log('\n✅ Updated existing wage entry');
    } else {
      wage = await SalarySummary.create({
        staff: testData.staffId,
        year: year,
        month: month,
        dailyWage: Number(testData.dailyRate),
        baseSalary: Number(testData.dailyRate),
        grossSalary: Number(testData.dailyRate),
        netSalary: Number(testData.dailyRate),
        workingDays: 1,
        wageType: 'daily',
        status: 'calculated',
        calculatedAt: new Date()
      });
      console.log('\n✅ Created new wage entry');
    }

    await wage.populate('staff', 'name email role');
    console.log('\n📊 Wage Entry:');
    console.log('   Staff:', wage.staff.name);
    console.log('   Daily Wage:', wage.dailyWage);
    console.log('   Working Days:', wage.workingDays);
    console.log('   Gross Salary:', wage.grossSalary);

    // Try to sync to Salary model
    console.log('\n🔄 Syncing to Salary model...');
    const existingSalary = await Salary.findOne({
      staffMember: testData.staffId,
      year: year,
      month: month
    });

    if (existingSalary) {
      existingSalary.basicSalary = wage.grossSalary;
      existingSalary.grossSalary = wage.grossSalary;
      existingSalary.netSalary = wage.netSalary;
      existingSalary.presentDays = wage.workingDays;
      await existingSalary.save();
      console.log('✅ Updated existing Salary record');
    } else {
      await Salary.create({
        staffMember: testData.staffId,
        year: year,
        month: month,
        period: `${year}-${String(month).padStart(2, '0')}`,
        basicSalary: wage.grossSalary,
        grossSalary: wage.grossSalary,
        netSalary: wage.netSalary,
        presentDays: wage.workingDays,
        totalDays: 30,
        status: 'pending'
      });
      console.log('✅ Created new Salary record');
    }

    console.log('\n✅ Test completed successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testWageCreation();
