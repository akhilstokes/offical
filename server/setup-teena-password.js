const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/userModel');

async function setupTeenaPassword() {
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

    console.log('👤 Setting up password for Teena...');
    console.log(`   Name: ${teena.name}`);
    console.log(`   Email: ${teena.email}`);
    console.log('');

    // Set a default password
    const defaultPassword = 'teena123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);
    
    teena.password = hashedPassword;
    await teena.save();

    console.log('✅ Password set successfully!');
    console.log('');
    console.log('📋 Login Credentials:');
    console.log(`   Email: ${teena.email}`);
    console.log(`   Password: ${defaultPassword}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Ask Teena to change this password after first login!');

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

setupTeenaPassword();
