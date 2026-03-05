const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const fixExpenseIndexes = async () => {
    try {
        console.log('🔧 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('expenses');

        // Get all indexes
        console.log('\n📋 Current indexes:');
        const indexes = await collection.indexes();
        indexes.forEach(index => {
            console.log(`  - ${JSON.stringify(index.key)}`);
        });

        // Drop the problematic expenseNumber index if it exists
        try {
            console.log('\n🗑️  Attempting to drop expenseNumber_1 index...');
            await collection.dropIndex('expenseNumber_1');
            console.log('✅ Successfully dropped expenseNumber_1 index');
        } catch (error) {
            if (error.code === 27) {
                console.log('ℹ️  Index expenseNumber_1 does not exist (already removed)');
            } else {
                console.log('⚠️  Error dropping index:', error.message);
            }
        }

        // Ensure correct indexes exist
        console.log('\n🔨 Ensuring correct indexes...');
        
        // Drop expenseId index if it exists and recreate as sparse
        try {
            await collection.dropIndex('expenseId_1');
            console.log('✅ Dropped old expenseId_1 index');
        } catch (error) {
            console.log('ℹ️  expenseId_1 index does not exist');
        }

        // Create sparse unique index for expenseId (allows null/undefined)
        await collection.createIndex(
            { expenseId: 1 }, 
            { unique: true, sparse: true, name: 'expenseId_1' }
        );
        console.log('✅ Created sparse unique index on expenseId');

        // List final indexes
        console.log('\n📋 Final indexes:');
        const finalIndexes = await collection.indexes();
        finalIndexes.forEach(index => {
            console.log(`  - ${JSON.stringify(index.key)} ${index.sparse ? '(sparse)' : ''}`);
        });

        console.log('\n✅ Index fix completed successfully!');
        console.log('💡 You can now create expenses without errors');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Disconnected from MongoDB');
    }
};

fixExpenseIndexes();
