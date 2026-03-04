const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const Expense = require('./models/expenseModel');

async function checkExpenses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const expenses = await Expense.find({})
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`\n📊 Total Expenses: ${expenses.length}`);
    
    if (expenses.length === 0) {
      console.log('\n⚠️ No expenses found in database');
      console.log('The expense tracker is empty. You can create expenses using the "+ Create Expense" button.');
    } else {
      console.log('\n📋 Recent Expenses:');
      expenses.forEach((exp, i) => {
        console.log(`\n${i + 1}. ${exp.expenseNumber}`);
        console.log(`   Party: ${exp.partyName}`);
        console.log(`   Category: ${exp.category}`);
        console.log(`   Amount: ₹${exp.totalAmount}`);
        console.log(`   Status: ${exp.status}`);
        console.log(`   Date: ${exp.date.toLocaleDateString()}`);
        console.log(`   Created By: ${exp.createdBy?.name || 'Unknown'} (${exp.createdBy?.role || 'N/A'})`);
      });
    }

    // Check stats
    const stats = await Expense.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
        }
      }
    ]);

    if (stats.length > 0) {
      console.log('\n📈 Expense Statistics:');
      console.log(`   Total: ${stats[0].total}`);
      console.log(`   Total Amount: ₹${stats[0].totalAmount}`);
      console.log(`   Pending: ${stats[0].pending}`);
      console.log(`   Approved: ${stats[0].approved}`);
      console.log(`   Rejected: ${stats[0].rejected}`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkExpenses();
