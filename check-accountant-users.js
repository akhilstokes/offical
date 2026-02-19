/**
 * Check Accountant Users in Database
 * This script lists all users with accountant role
 */

require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/holy-family-polymers';

// User Schema (simplified)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  createdAt: Date
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function checkAccountantUsers() {
  try {
    console.log('\n========================================');
    console.log('CHECKING ACCOUNTANT USERS');
    console.log('========================================\n');

    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find all accountant users
    const accountants = await User.find({ role: 'accountant' }).select('name email role createdAt');

    if (accountants.length === 0) {
      console.log('❌ No accountant users found in database!\n');
      console.log('You need to create an accountant user first.');
      console.log('Run: node create-test-accountant.js\n');
    } else {
      console.log(`✅ Found ${accountants.length} accountant user(s):\n`);
      
      accountants.forEach((user, index) => {
        console.log(`${index + 1}. Accountant User:`);
        console.log(`   Name: ${user.name || 'N/A'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${user.createdAt ? user.createdAt.toLocaleDateString() : 'N/A'}`);
        console.log('');
      });

      console.log('========================================');
      console.log('TO USE IN TESTS:');
      console.log('========================================\n');
      console.log('Update tests/selenium/accountant-crud-tests.js:');
      console.log('');
      console.log('const ACCOUNTANT_CREDENTIALS = {');
      console.log(`  email: '${accountants[0].email}',`);
      console.log(`  password: 'your-password-here'  // ← You need to know the password`);
      console.log('};');
      console.log('');
    }

    // Also check for users with admin role (they might have accountant access)
    const admins = await User.find({ role: 'admin' }).select('name email role');
    if (admins.length > 0) {
      console.log('\n📝 Note: Found admin users (they may also have accountant access):');
      admins.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email}`);
      });
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.\n');
  }
}

// Run the check
checkAccountantUsers();
