/**
 * Migration Script: Add userId field to existing DeliveryIntake records
 * 
 * This script updates all existing DeliveryIntake records to include a userId field.
 * For records where userId is missing, it sets userId = createdBy (the user who created the request).
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const DeliveryIntake = require('../models/deliveryIntakeModel');

const migrateDeliveryIntakes = async () => {
  try {
    console.log('🔄 Starting DeliveryIntake migration...');
    console.log(`📡 Connecting to MongoDB: ${process.env.MONGO_URI}`);
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all intakes without userId field
    const intakesWithoutUserId = await DeliveryIntake.find({ 
      userId: { $exists: false } 
    });

    console.log(`\n📊 Found ${intakesWithoutUserId.length} records without userId field`);

    if (intakesWithoutUserId.length === 0) {
      console.log('✅ All records already have userId field. No migration needed.');
      await mongoose.connection.close();
      return;
    }

    let updated = 0;
    let failed = 0;

    for (const intake of intakesWithoutUserId) {
      try {
        // Set userId to createdBy (the user who created the request owns the barrels)
        intake.userId = intake.createdBy;
        await intake.save();
        updated++;
        console.log(`✅ Updated intake ${intake._id}: userId set to ${intake.createdBy}`);
      } catch (error) {
        failed++;
        console.error(`❌ Failed to update intake ${intake._id}:`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successfully updated: ${updated} records`);
    console.log(`   ❌ Failed: ${failed} records`);
    console.log(`   📦 Total processed: ${intakesWithoutUserId.length} records`);

    await mongoose.connection.close();
    console.log('\n✅ Migration completed and database connection closed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration
migrateDeliveryIntakes();
