const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const Expense = require('./models/expenseModel');
const User = require('./models/userModel');

async function createSampleExpenses() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find a manager user to be the creator
    const manager = await User.findOne({ role: 'manager' });
    if (!manager) {
      console.log('❌ No manager found. Please create a manager user first.');
      await mongoose.connection.close();
      return;
    }

    console.log(`✅ Found manager: ${manager.name} (${manager.email})`);

    // Check existing expenses
    const existingCount = await Expense.countDocuments();
    console.log(`📊 Existing expenses: ${existingCount}`);

    // Sample expenses data
    const sampleExpenses = [
      {
        partyName: 'ABC Chemicals Ltd',
        category: 'Equipment',
        date: new Date('2026-03-01'),
        description: 'Purchase of latex processing chemicals',
        items: [
          { description: 'Formic Acid (50L)', quantity: 10, amount: 1500 },
          { description: 'Ammonia Solution (25L)', quantity: 5, amount: 800 }
        ],
        gstEnabled: true,
        createdBy: manager._id
      },
      {
        partyName: 'XYZ Transport Services',
        category: 'Travel & Transport',
        date: new Date('2026-03-02'),
        description: 'Monthly transportation charges',
        items: [
          { description: 'Truck rental - March 2026', quantity: 1, amount: 15000 }
        ],
        gstEnabled: true,
        createdBy: manager._id
      },
      {
        partyName: 'Power Supply Corporation',
        category: 'Utilities',
        date: new Date('2026-02-28'),
        description: 'Electricity bill for February',
        items: [
          { description: 'Electricity consumption', quantity: 1, amount: 8500 }
        ],
        gstEnabled: false,
        createdBy: manager._id
      },
      {
        partyName: 'Office Supplies Co',
        category: 'Office Supplies',
        date: new Date('2026-03-03'),
        description: 'Office stationery and supplies',
        items: [
          { description: 'A4 Paper (10 reams)', quantity: 10, amount: 500 },
          { description: 'Printer ink cartridges', quantity: 4, amount: 2400 },
          { description: 'Pens and markers', quantity: 1, amount: 350 }
        ],
        gstEnabled: true,
        createdBy: manager._id
      },
      {
        partyName: 'Maintenance Services Ltd',
        category: 'Maintenance',
        date: new Date('2026-02-25'),
        description: 'Equipment maintenance and repairs',
        items: [
          { description: 'Barrel cleaning machine service', quantity: 1, amount: 5000 },
          { description: 'Conveyor belt repair', quantity: 1, amount: 3500 }
        ],
        gstEnabled: true,
        createdBy: manager._id,
        status: 'approved',
        approvedBy: manager._id,
        approvedAt: new Date('2026-02-26')
      },
      {
        partyName: 'Safety Equipment Suppliers',
        category: 'Equipment',
        date: new Date('2026-02-20'),
        description: 'Safety gear for workers',
        items: [
          { description: 'Safety helmets', quantity: 20, amount: 4000 },
          { description: 'Safety gloves', quantity: 50, amount: 2500 },
          { description: 'Safety boots', quantity: 15, amount: 6000 }
        ],
        gstEnabled: true,
        createdBy: manager._id,
        status: 'approved',
        approvedBy: manager._id,
        approvedAt: new Date('2026-02-21')
      },
      {
        partyName: 'Marketing Agency',
        category: 'Marketing',
        date: new Date('2026-02-15'),
        description: 'Digital marketing campaign',
        items: [
          { description: 'Social media ads', quantity: 1, amount: 12000 },
          { description: 'Website maintenance', quantity: 1, amount: 5000 }
        ],
        gstEnabled: true,
        createdBy: manager._id,
        status: 'approved',
        approvedBy: manager._id,
        approvedAt: new Date('2026-02-16')
      },
      {
        partyName: 'Legal Consultants',
        category: 'Professional Services',
        date: new Date('2026-02-10'),
        description: 'Legal consultation fees',
        items: [
          { description: 'Contract review', quantity: 1, amount: 8000 }
        ],
        gstEnabled: true,
        createdBy: manager._id,
        status: 'pending'
      }
    ];

    console.log(`\n📝 Creating ${sampleExpenses.length} sample expenses...`);

    for (const expenseData of sampleExpenses) {
      // Generate unique expense number
      let expenseNumber;
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 10) {
        expenseNumber = Expense.generateExpenseNumber();
        const existing = await Expense.findOne({ expenseNumber });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      const expense = new Expense({
        ...expenseData,
        expenseNumber
      });

      // Manually trigger calculation before save
      const subtotal = expense.items.reduce((sum, item) => sum + (item.quantity * item.amount), 0);
      if (expense.gstEnabled) {
        expense.gstAmount = subtotal * 0.18;
        expense.totalAmount = subtotal + expense.gstAmount;
      } else {
        expense.gstAmount = 0;
        expense.totalAmount = subtotal;
      }

      await expense.save();
      console.log(`✅ Created: ${expense.expenseNumber} - ${expense.partyName} - ₹${expense.totalAmount}`);
    }

    // Show summary
    const totalExpenses = await Expense.countDocuments();
    const totalAmount = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    console.log(`\n📊 Summary:`);
    console.log(`   Total Expenses: ${totalExpenses}`);
    console.log(`   Total Amount: ₹${totalAmount[0]?.total || 0}`);

    const byStatus = await Expense.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    console.log(`\n📈 By Status:`);
    byStatus.forEach(s => {
      console.log(`   ${s._id}: ${s.count}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Done! Expense history created successfully.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createSampleExpenses();
