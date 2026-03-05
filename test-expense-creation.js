const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const Expense = require('./server/models/expenseModel');
const User = require('./server/models/userModel');

async function testExpenseCreation() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find an admin user
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('❌ No admin user found');
            process.exit(1);
        }
        console.log(`✅ Found admin: ${admin.name} (${admin.email})`);

        // Create test expense with items
        const testExpense = {
            title: 'Test Office Supplies',
            description: 'Testing expense creation with items',
            category: 'other_expenses',
            paymentMethod: 'cash',
            expenseDate: new Date(),
            items: [
                { name: 'Paper', rate: 500, quantity: 10 },
                { name: 'Pens', rate: 20, quantity: 50 }
            ],
            gstEnabled: true,
            gstAmount: 1080,
            totalAmount: 7080,
            amount: 7080,
            createdBy: admin._id,
            createdByRole: 'admin',
            history: [{
                action: 'created',
                performedBy: admin._id,
                performedByName: admin.name,
                performedByRole: 'admin',
                timestamp: new Date(),
                remarks: 'Test expense created'
            }]
        };

        console.log('\n📝 Creating test expense...');
        const expense = await Expense.create(testExpense);
        console.log('✅ Expense created successfully!');
        console.log(`   ID: ${expense.expenseId}`);
        console.log(`   Title: ${expense.title}`);
        console.log(`   Items: ${expense.items.length}`);
        console.log(`   Subtotal: ₹${(expense.totalAmount - expense.gstAmount).toFixed(2)}`);
        console.log(`   GST: ₹${expense.gstAmount.toFixed(2)}`);
        console.log(`   Total: ₹${expense.totalAmount.toFixed(2)}`);

        console.log('\n✅ Test completed successfully!');
        
        // Clean up test expense
        await Expense.findByIdAndDelete(expense._id);
        console.log('🧹 Test expense cleaned up');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

testExpenseCreation();
