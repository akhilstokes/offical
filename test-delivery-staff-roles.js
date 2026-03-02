const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const User = require('./models/userModel');

async function checkDeliveryStaff() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all users
    const allUsers = await User.find({}).select('name email role');
    console.log(`📊 Total users in database: ${allUsers.length}\n`);

    // Group by role
    const roleGroups = {};
    allUsers.forEach(user => {
      const role = user.role || 'no_role';
      if (!roleGroups[role]) {
        roleGroups[role] = [];
      }
      roleGroups[role].push(user);
    });

    console.log('📋 Users grouped by role:');
    console.log('='.repeat(60));
    Object.keys(roleGroups).sort().forEach(role => {
      console.log(`\n${role.toUpperCase()} (${roleGroups[role].length} users):`);
      roleGroups[role].forEach(user => {
        console.log(`  - ${user.name} (${user.email})`);
      });
    });

    // Check what the API endpoint would return
    console.log('\n' + '='.repeat(60));
    console.log('🔍 Staff that would be returned by /api/users/all-staff:');
    console.log('='.repeat(60));
    const staffRoles = ['field_staff', 'delivery_staff', 'lab_staff', 'staff', 'accountant'];
    const staff = await User.find({
      role: { $in: staffRoles }
    }).select('name email role');
    
    console.log(`\nTotal staff: ${staff.length}`);
    staff.forEach(s => {
      console.log(`  - ${s.name} (${s.email}) - Role: ${s.role}`);
    });

    // Check delivery staff specifically
    console.log('\n' + '='.repeat(60));
    console.log('🚚 Delivery staff filtering (what frontend would show):');
    console.log('='.repeat(60));
    const deliveryOnly = staff.filter(s => 
      s.role === 'delivery_staff' || 
      s.role === 'delivery' ||
      s.role?.toLowerCase().includes('delivery')
    );
    
    if (deliveryOnly.length === 0) {
      console.log('\n❌ NO DELIVERY STAFF FOUND!');
      console.log('\n💡 To fix this, you need to:');
      console.log('   1. Create users with role "delivery_staff", OR');
      console.log('   2. Update existing users to have role "delivery_staff"');
      console.log('\n📝 Available roles in your database:');
      console.log('   ' + Object.keys(roleGroups).join(', '));
    } else {
      console.log(`\n✅ Found ${deliveryOnly.length} delivery staff:`);
      deliveryOnly.forEach(s => {
        console.log(`  - ${s.name} (${s.email}) - Role: ${s.role}`);
      });
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDeliveryStaff();
