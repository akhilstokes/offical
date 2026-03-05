const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

async function debugExpense() {
    try {
        console.log('🔍 Debugging Expense Creation Error...\n');
        
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected\n');

        // Load models
        const Expense = require('./server/models/expenseModel');
        const User = require('./server/models/userModel');

        // Find admin user
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('❌ No admin user found');
            process.exit(1);
        }
        console.log(`✅ Found admin: ${admin.name}\n`);

        // Test data matching your form
        const testData = {
            title: 'Cake Purchase',
            description: '',
            category: 'other_expenses',
            subcategory: '',
            paymentMethod: 'cash',
            transactionId: '',
            expenseDate: new Date(),
            dueDate: '',
            items: [
                { name: 'cake', rate: 99.99, quantity: 1 }
            ],
            gstEnabled: true,
            gstAmount: 18.00,
            totalAmount: 117.99,
            amount: 117.99,
            notes: '',
            createdBy: admin._id,
            createdByRole: 'admin',
            history: [{
                action: 'created',
                performedBy: admin._id,
                performedByName: admin.name,
                performedByRole: 'admin',
                timestamp: new Date(),
                remarks: 'Expense created'
            }]
        };

        console.log('📝 Test Data:');
        console.log(JSON.stringify(testData, null, 2));
        console.log('\n🔄 Creating expense...\n');

        const expense = await Expense.create(testData);
        
        console.log('✅ SUCCESS! Expense created:');
        console.log(`   ID: ${expense.expenseId}`);
        console.log(`   Title: ${expense.title}`);
        console.log(`   Items: ${expense.items.length}`);
        console.log(`   Amount: ₹${expense.amount}`);
        console.log(`   GST: ₹${expense.gstAmount}`);
        console.log(`   Total: ₹${expense.totalAmount}`);

        // Clean up
        await Expense.findByIdAndDelete(expense._id);
        console.log('\n🧹 Test expense deleted');
        
        console.log('\n✅ All tests passed! The model is working correctly.');
        console.log('   The issue must be in the controller or authentication.');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\nFull error:');
        console.error(error);
        process.exit(1);
    }
}

debugExpense();
