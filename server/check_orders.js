const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const ProductOrder = require('./models/productOrderModel');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const count = await ProductOrder.countDocuments();
        console.log(`Total ProductOrders: ${count}`);

        const orders = await ProductOrder.find().limit(5).populate('customerId', 'name role');
        console.log('Recent 5 orders:', JSON.stringify(orders, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Error checking orders:', err);
        process.exit(1);
    }
};

checkOrders();
