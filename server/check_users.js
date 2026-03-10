const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/userModel');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const count = await User.countDocuments();
        console.log(`Total Users: ${count}`);

        const users = await User.find().limit(5).select('name email role');
        console.log('Recent 5 users:', JSON.stringify(users, null, 2));

        process.exit(0);
    } catch (err) {
        console.error('Error checking users:', err);
        process.exit(1);
    }
};

checkUsers();
