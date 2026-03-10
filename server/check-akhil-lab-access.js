const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const User = require('./models/userModel');

async function checkAkhilLabAccess() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Find Akhil's user record
    const akhil = await User.findOne({ email: 'akhilnk239@gmail.com' });
    
    if (!akhil) {
      console.log('❌ Akhil user not found with email akhilnk239@gmail.com');
      
      // Try alternative email
      const akhilAlt = await User.findOne({ name: /akhil/i });
      if (akhilAlt) {
        console.log('\n✓ Found user with similar name:');
        console.log('  ID:', akhilAlt._id);
        console.log('  Name:', akhilAlt.name);
        console.log('  Email:', akhilAlt.email);
        console.log('  Role:', akhilAlt.role);
        console.log('  Status:', akhilAlt.status);
      }
    } else {
      console.log('✓ Found Akhil user:');
      console.log('  ID:', akhil._id);
      console.log('  Name:', akhil.name);
      console.log('  Email:', akhil.email);
      console.log('  Role:', akhil.role);
      console.log('  Status:', akhil.status);
      console.log('  RFID:', akhil.rfidUid || 'Not set');
      
      // Check if role is correct for lab access
      const validLabRoles = ['lab', 'lab_staff', 'lab_manager', 'admin'];
      if (validLabRoles.includes(akhil.role)) {
        console.log('\n✅ Role is valid for lab dashboard access');
      } else {
        console.log('\n❌ Role is NOT valid for lab dashboard');
        console.log('   Current role:', akhil.role);
        console.log('   Valid roles:', validLabRoles.join(', '));
        console.log('\n   Updating role to "lab"...');
        
        akhil.role = 'lab';
        await akhil.save();
        console.log('   ✓ Role updated to "lab"');
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAkhilLabAccess();
