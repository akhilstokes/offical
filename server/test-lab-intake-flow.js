const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const User = require('./models/userModel');
const DeliveryIntake = require('./models/deliveryIntakeModel');

async function testLabIntakeFlow() {
  try {
    console.log('\n🔍 Testing Lab Intake Flow...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to database\n');
    
    // 1. Check all intake records
    const allIntakes = await DeliveryIntake.find({})
      .populate('createdBy', 'name email role')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`📊 Total intake records in database: ${await DeliveryIntake.countDocuments({})}`);
    console.log(`📋 Recent 10 intakes:\n`);
    
    allIntakes.forEach((intake, index) => {
      console.log(`${index + 1}. ID: ${intake._id}`);
      console.log(`   Customer: ${intake.name || 'N/A'}`);
      console.log(`   Phone: ${intake.phone || 'N/A'}`);
      console.log(`   Barrel Count: ${intake.barrelCount || 0}`);
      console.log(`   Status: ${intake.status || 'N/A'}`);
      console.log(`   Request ID: ${intake.requestId || 'N/A'}`);
      console.log(`   Created By: ${intake.createdBy?.name || 'N/A'} (${intake.createdBy?.role || 'N/A'})`);
      console.log(`   Created At: ${intake.createdAt}`);
      console.log(`   Arrival Time: ${intake.arrivalTime || 'N/A'}`);
      console.log('');
    });
    
    // 2. Check pending intakes specifically
    const pendingIntakes = await DeliveryIntake.find({ status: 'pending' })
      .populate('createdBy', 'name email role')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`\n🔔 Pending intakes (should appear in Lab Dashboard): ${pendingIntakes.length}\n`);
    
    if (pendingIntakes.length === 0) {
      console.log('❌ NO PENDING INTAKES FOUND!');
      console.log('   This is why the Lab Dashboard shows 0 requests.\n');
      
      // Check what statuses exist
      const statusCounts = await DeliveryIntake.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      console.log('📊 Intake records by status:');
      statusCounts.forEach(stat => {
        console.log(`   ${stat._id || 'null'}: ${stat.count}`);
      });
    } else {
      pendingIntakes.forEach((intake, index) => {
        console.log(`${index + 1}. ID: ${intake._id}`);
        console.log(`   Customer: ${intake.name || 'N/A'}`);
        console.log(`   Phone: ${intake.phone || 'N/A'}`);
        console.log(`   Barrel Count: ${intake.barrelCount || 0}`);
        console.log(`   Request ID: ${intake.requestId || 'N/A'}`);
        console.log(`   Created By: ${intake.createdBy?.name || 'N/A'} (${intake.createdBy?.role || 'N/A'})`);
        console.log(`   Created At: ${intake.createdAt}`);
        console.log('');
      });
    }
    
    // 3. Check if there are any intakes created by delivery staff
    const deliveryStaffIntakes = await DeliveryIntake.find({})
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(20);
    
    const deliveryCreated = deliveryStaffIntakes.filter(intake => 
      intake.createdBy && (
        intake.createdBy.role === 'delivery_staff' || 
        intake.createdBy.role === 'delivery' ||
        intake.createdBy.role === 'field_staff'
      )
    );
    
    console.log(`\n📦 Intakes created by delivery staff: ${deliveryCreated.length}\n`);
    
    if (deliveryCreated.length > 0) {
      deliveryCreated.slice(0, 5).forEach((intake, index) => {
        console.log(`${index + 1}. ID: ${intake._id}`);
        console.log(`   Customer: ${intake.name || 'N/A'}`);
        console.log(`   Status: ${intake.status || 'N/A'}`);
        console.log(`   Created By: ${intake.createdBy?.name || 'N/A'} (${intake.createdBy?.role || 'N/A'})`);
        console.log(`   Created At: ${intake.createdAt}`);
        console.log('');
      });
    }
    
    console.log('\n✅ Test complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

testLabIntakeFlow();
