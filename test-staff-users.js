const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const User = require('./server/models/userModel');

async function testStaffUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all staff users
    const staffRoles = ['field_staff', 'lab_staff', 'delivery_staff'];
    const staffUsers = await User.find({ 
      role: { $in: staffRoles },
      status: { $ne: 'deleted' }
    }).select('name email role status');

    console.log('\n📋 Staff Users Found:', staffUsers.length);
    
    if (staffUsers.length > 0) {
      console.log('\nStaff Members:');
      staffUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   Role: ${user.role}, Status: ${user.status}`);
        console.log(`   ID: ${user._id}`);
      });
    } else {
      console.log('\n⚠️ No staff users found in database!');
      console.log('You need to create staff users first.');
    }

    // Also check all users
    const allUsers = await User.find().select('name email role status');
    console.log('\n📊 All Users in Database:', allUsers.length);
    console.log('\nUsers by Role:');
    const roleCount = {};
    allUsers.forEach(user => {
      roleCount[user.role] = (roleCount[user.role] || 0) + 1;
    });
    console.log(roleCount);

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testStaffUsers();
