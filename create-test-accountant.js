/**
 * Create Test Accountant User
 * This script creates a test accountant user for running tests
 */

require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/holy-family-polymers';

// User Schema (simplified)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  createdAt: { type: Date, default: Date.now }
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function createTestAccountant() {
  try {
    console.log('\n========================================');
    console.log('CREATE TEST ACCOUNTANT USER');
    console.log('========================================\n');

    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Test user details
    const testUser = {
      name: 'Test Accountant',
      email: 'accountant@holyfamily.com',
      password: 'accountant123',
      role: 'accountant'
    };

    // Check if user already exists
    const existingUser = await User.findOne({ email: testUser.email });
    
    if (existingUser) {
      console.log('⚠️  User already exists!');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}\n`);
      
      // Ask if they want to update the password
      console.log('Do you want to update the password to "accountant123"?');
      console.log('If yes, manually update or delete the user first.\n');
      
      console.log('========================================');
      console.log('EXISTING USER CREDENTIALS:');
      console.log('========================================');
      console.log(`Email: ${existingUser.email}`);
      console.log('Password: (use your existing password)');
      console.log('');
      console.log('Update tests/selenium/accountant-crud-tests.js with these credentials.');
      console.log('');
      
    } else {
      // Hash password
      console.log('Creating new accountant user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(testUser.password, salt);

      // Create user
      const newUser = new User({
        name: testUser.name,
        email: testUser.email,
        password: hashedPassword,
        role: testUser.role
      });

      await newUser.save();

      console.log('✅ Test accountant user created successfully!\n');
      console.log('========================================');
      console.log('TEST USER CREDENTIALS:');
      console.log('========================================');
      console.log(`Name: ${testUser.name}`);
      console.log(`Email: ${testUser.email}`);
      console.log(`Password: ${testUser.password}`);
      console.log(`Role: ${testUser.role}`);
      console.log('');
      console.log('========================================');
      console.log('READY TO TEST!');
      console.log('========================================');
      console.log('The test file is already configured with these credentials.');
      console.log('You can now run: .\\run-accountant-tests.bat');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure MongoDB is running');
    console.error('2. Check your .env file in server folder');
    console.error('3. Verify MONGODB_URI is correct');
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.\n');
  }
}

// Run the script
createTestAccountant();
