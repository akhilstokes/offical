/**
 * Test Script: Verify Barrel Automatic Deduction
 * 
 * This script tests that barrels are properly deducted when a user creates a sell request
 * 
 * Run from server directory: node test-barrel-deduction.js
 */

require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Barrel = require('./models/barrelModel');
const DeliveryIntake = require('./models/deliveryIntakeModel');
const User = require('./models/userModel');

const testBarrelDeduction = async () => {
  try {
    console.log('🧪 Starting Barrel Deduction Test...\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a test user (you can replace with your user email)
    const testUserEmail = 'akhil@gmail.com'; // Change this to your test user
    const user = await User.findOne({ email: testUserEmail });
    
    if (!user) {
      console.log(`❌ User with email ${testUserEmail} not found`);
      console.log('Please update the testUserEmail variable in the script');
      await mongoose.connection.close();
      return;
    }

    console.log(`👤 Testing with user: ${user.name} (${user.email})`);
    console.log(`   User ID: ${user._id}\n`);

    // Check user's barrels
    console.log('📊 Checking user\'s barrel inventory...');
    
    const allBarrels = await Barrel.find({ assignedTo: user._id });
    console.log(`   Total barrels assigned: ${allBarrels.length}`);
    
    const availableBarrels = await Barrel.find({ 
      assignedTo: user._id,
      status: 'in-use'
    }).sort({ assignedDate: 1 });
    console.log(`   Available barrels (in-use): ${availableBarrels.length}`);
    
    const pendingSaleBarrels = await Barrel.find({ 
      assignedTo: user._id,
      status: 'pending_sale'
    });
    console.log(`   Barrels pending sale: ${pendingSaleBarrels.length}`);
    
    const soldBarrels = await Barrel.find({ 
      status: 'sold',
      barrelId: { $in: allBarrels.map(b => b.barrelId) }
    });
    console.log(`   Barrels sold: ${soldBarrels.length}\n`);

    // Show barrel details
    if (availableBarrels.length > 0) {
      console.log('📦 Available Barrels:');
      availableBarrels.forEach((barrel, index) => {
        console.log(`   ${index + 1}. ${barrel.barrelId} - Status: ${barrel.status}, Assigned: ${barrel.assignedDate?.toLocaleDateString() || 'N/A'}`);
      });
      console.log('');
    }

    if (pendingSaleBarrels.length > 0) {
      console.log('⏳ Barrels Pending Sale:');
      pendingSaleBarrels.forEach((barrel, index) => {
        console.log(`   ${index + 1}. ${barrel.barrelId} - Status: ${barrel.status}, Location: ${barrel.lastKnownLocation}`);
      });
      console.log('');
    }

    // Check sell requests
    console.log('📋 Checking sell requests...');
    const sellRequests = await DeliveryIntake.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log(`   Total sell requests: ${sellRequests.length}\n`);
    
    if (sellRequests.length > 0) {
      console.log('Recent Sell Requests:');
      sellRequests.forEach((request, index) => {
        console.log(`   ${index + 1}. ${request.barrelCount} barrel(s) - Status: ${request.status}`);
        console.log(`      Created: ${request.createdAt.toLocaleDateString()}`);
        console.log(`      Barrel IDs: ${request.barrelIds?.join(', ') || 'None'}`);
        console.log('');
      });
    }

    // Summary
    console.log('📊 SUMMARY:');
    console.log(`   ✅ Available to sell: ${availableBarrels.length} barrel(s)`);
    console.log(`   ⏳ Pending sale: ${pendingSaleBarrels.length} barrel(s)`);
    console.log(`   ✔️  Sold: ${soldBarrels.length} barrel(s)`);
    console.log(`   📦 Total assigned: ${allBarrels.length} barrel(s)\n`);

    // Test recommendation
    if (availableBarrels.length === 0) {
      console.log('⚠️  WARNING: User has no available barrels to sell!');
      console.log('   This is expected if all barrels are pending sale or sold.');
    } else {
      console.log(`✅ User can create sell requests for up to ${availableBarrels.length} barrel(s)`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Test completed and database connection closed');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

// Run test
testBarrelDeduction();
