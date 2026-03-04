const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

const checkDeliveryStaff = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const User = require('./server/models/userModel');

    // Find all delivery staff
    const deliveryStaff = await User.find({ 
      role: 'delivery_staff',
      status: { $in: ['active', 'approved'] }
    }).select('name email staffId role status');

    console.log(`\n📋 Delivery Staff (${deliveryStaff.length}):`);
    
    if (deliveryStaff.length === 0) {
      console.log('❌ No delivery staff found!');
      console.log('\nTo fix this, you need to:');
      console.log('1. Go to Admin > Staff Management');
      console.log('2. Invite a delivery staff member');
      console.log('3. Have them complete registration');
      console.log('4. Approve them as admin');
    } else {
      deliveryStaff.forEach(staff => {
        console.log(`  ✅ ${staff.name} (${staff.email})`);
        console.log(`     Staff ID: ${staff.staffId || 'Not set'}`);
        console.log(`     Status: ${staff.status}`);
        console.log('');
      });
    }

    // Also check all users with any role
    const allUsers = await User.find().select('name email role status');
    console.log(`\n📊 All Users by Role:`);
    const roleCount = {};
    allUsers.forEach(u => {
      const role = u.role || 'unknown';
      roleCount[role] = (roleCount[role] || 0) + 1;
    });
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkDeliveryStaff();
