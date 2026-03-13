const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const checkIntakes = async () => {
  await connectDB();
  const DeliveryIntake = require('./models/deliveryIntakeModel');
  
  const m4 = new Date('2026-03-04T00:00:00Z');
  const intakes = await DeliveryIntake.find({
    createdAt: { $gte: m4 }
  }).sort({ createdAt: -1 });
  
  console.log(`Found ${intakes.length} intakes since March 4th, 2026`);
  intakes.forEach(i => {
    console.log(JSON.stringify({
      id: i._id,
      status: i.status,
      createdAt: i.createdAt,
      name: i.name,
      reqNum: i.requestNumber,
      requestId: i.requestId,
      taskId: i.taskId
    }, null, 2));
  });
  
  process.exit();
};

checkIntakes();
