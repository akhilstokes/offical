const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/userModel');

async function testTeenaLogin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Teena's account
    const teena = await User.findOne({ email: 'teena68@gmail.com' });
    
    if (!teena) {
      console.log('❌ Teena account not found!');
      mongoose.connection.close();
      return;
    }

    console.log('👤 Teena Account Details:');
    console.log(`   Name: ${teena.name}`);
    console.log(`   Email: ${teena.email}`);
    console.log(`   Phone: ${teena.phoneNumber}`);
    console.log(`   Role: ${teena.role}`);
    console.log(`   User ID: ${teena._id}`);
    console.log(`   Has Password: ${teena.password ? 'Yes' : 'No'}`);
    console.log(`   Google ID: ${teena.googleId || 'None'}`);
    console.log('');

    // Check if there are multiple accounts with similar names
    const similarAccounts = await User.find({ 
      name: /teena/i 
    });
    
    console.log(`📋 Accounts with "teena" in name: ${similarAccounts.length}`);
    similarAccounts.forEach(acc => {
      console.log(`   - ${acc.name} (${acc.email})`);
      console.log(`     ID: ${acc._id}`);
      console.log(`     Role: ${acc.role}`);
      console.log('');
    });

    // Test password if provided
    const testPassword = 'teena123'; // Common test password
    if (teena.password) {
      const isMatch = await bcrypt.compare(testPassword, teena.password);
      console.log(`🔐 Password Test (${testPassword}): ${isMatch ? '✅ Match' : '❌ No match'}`);
    }

    mongoose.connection.close();
    console.log('\n✅ Check complete');
    console.log('\n💡 To login as Teena:');
    console.log(`   Email: ${teena.email}`);
    console.log(`   Make sure you\'re using the correct password or Google login`);
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

testTeenaLogin();
