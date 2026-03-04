const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });

const User = require('./server/models/userModel');

async function updateAkhilRole() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find user by name or email
    const user = await User.findOne({
      $or: [
        { name: /akhil/i },
        { email: /akhil/i }
      ]
    });

    if (!user) {
      console.log('User "akhil" not found');
      return;
    }

    console.log('Found user:', {
      _id: user._id,
      name: user.name,
      email: user.email,
      currentRole: user.role
    });

    // Update role to delivery_staff
    user.role = 'delivery_staff';
    await user.save();

    console.log('✅ Successfully updated user role to delivery_staff');
    console.log('Updated user:', {
      _id: user._id,
      name: user.name,
      email: user.email,
      newRole: user.role
    });

    console.log('\n🔄 Please log out and log back in for changes to take effect');

  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateAkhilRole();
