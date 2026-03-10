const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const ProductOrder = require('./models/productOrderModel');
const User = require('./models/userModel');

dotenv.config({ path: path.join(__dirname, '.env') });

const createTestOrder = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ role: 'user' });
        if (!user) {
            console.log('No user found to assign the order to.');
            process.exit(1);
        }

        const newOrder = await ProductOrder.create({
            customerId: user._id,
            productType: '100kg_pack',
            packSizeName: '100kg Pack',
            quantity: 2,
            paymentMethod: 'UPI',
            deliveryAddress: 'Test Location, 123 Street',
            totalAmount: 30000,
            status: 'PENDING'
        });

        console.log('Test Order Created:', newOrder);
        process.exit(0);
    } catch (err) {
        console.error('Error creating test order:', err);
        process.exit(1);
    }
};

createTestOrder();
