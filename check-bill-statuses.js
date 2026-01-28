const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const Bill = require('./server/models/billModel');

async function checkBillStatuses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get all bills
        const allBills = await Bill.find({})
            .populate('userId', 'name phone')
            .populate('createdBy', 'name')
            .populate('verifiedBy', 'name')
            .sort({ createdAt: -1 })
            .limit(20);

        console.log(`\n📊 Found ${allBills.length} bills:\n`);

        allBills.forEach((bill, index) => {
            console.log(`${index + 1}. Bill: ${bill.billNumber}`);
            console.log(`   Customer: ${bill.customerName} (${bill.customerPhone})`);
            console.log(`   User ID: ${bill.userId?._id || 'NOT LINKED'}`);
            console.log(`   User Name: ${bill.userId?.name || 'N/A'}`);
            console.log(`   Status: ${bill.status}`);
            console.log(`   Created By: ${bill.createdBy?.name || 'Unknown'}`);
            console.log(`   Verified By: ${bill.verifiedBy?.name || 'Not verified'}`);
            console.log(`   Created At: ${bill.createdAt}`);
            console.log(`   Verified At: ${bill.verifiedAt || 'Not verified'}`);
            console.log('');
        });

        // Count by status
        const statusCounts = await Bill.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('\n📈 Bills by status:');
        statusCounts.forEach(item => {
            console.log(`   ${item._id}: ${item.count}`);
        });

        // Check bills that users can see
        const userVisibleBills = await Bill.find({
            status: { $in: ['manager_verified', 'approved', 'paid'] },
            userId: { $exists: true, $ne: null }
        }).populate('userId', 'name phone');

        console.log(`\n👥 Bills visible to users: ${userVisibleBills.length}`);
        userVisibleBills.forEach((bill, index) => {
            console.log(`${index + 1}. ${bill.billNumber} - ${bill.userId?.name} - Status: ${bill.status}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Connection closed');
    }
}

checkBillStatuses();
