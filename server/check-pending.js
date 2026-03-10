const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

(async () => {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    const Bill = require('./models/billModel');

    const pending = await Bill.find({ status: 'pending' })
        .sort({ createdAt: -1 })
        .lean();

    console.log('Pending bills:', pending.length);
    pending.forEach(b => {
        console.log('  Bill:', b.billNumber, '| Customer:', b.customerName, '| Amount:', b.totalAmount, '| Status:', b.status, '| Date:', b.createdAt);
    });

    // Show ALL bills to see what exists
    const allBills = await Bill.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    console.log('\nAll bills (latest 20):');
    allBills.forEach(b => {
        console.log('  ', b.billNumber, '| ', b.customerName, '| Status:', b.status, '| Amount:', b.totalAmount);
    });

    await mongoose.disconnect();
})();
