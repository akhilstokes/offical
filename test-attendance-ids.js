const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

const testIds = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const Attendance = require('./server/models/attendanceModel');

    // Test the problematic IDs
    const ids = [
      '69708bad5da88dbb78144d21',
      '6960bc48c785df30cc0576a6'
    ];

    for (const id of ids) {
      console.log(`\nTesting ID: ${id}`);
      console.log(`Is valid ObjectId: ${mongoose.Types.ObjectId.isValid(id)}`);
      
      try {
        const record = await Attendance.findById(id);
        if (record) {
          console.log(`✅ Found: ${record._id}`);
          console.log(`   Staff: ${record.staff}`);
          console.log(`   Status: ${record.status}`);
        } else {
          console.log(`❌ Not found in database`);
        }
      } catch (err) {
        console.log(`❌ Error: ${err.message}`);
      }
    }

    // List all attendance records
    const all = await Attendance.find().limit(5).select('_id staff status date');
    console.log(`\n📋 Sample attendance records (${all.length}):`);
    all.forEach(a => {
      console.log(`   ${a._id} - Staff: ${a.staff} - Status: ${a.status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testIds();
