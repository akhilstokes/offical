const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Complaint = require('./models/complaintModel');
const User = require('./models/userModel');

dotenv.config();

const createSampleComplaints = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Use a dummy ObjectId for testing
    const dummyUserId = new mongoose.Types.ObjectId();

    // Sample complaints
    const complaints = [
      {
        title: 'Equipment Malfunction',
        description: 'The latex testing machine is not working properly. It shows error code E-102.',
        category: 'equipment',
        priority: 'high',
        location: 'Lab Section A',
        department: 'Laboratory',
        reportedBy: dummyUserId,
        reportedByName: 'Lab Staff',
        reportedByRole: 'lab_staff',
        status: 'open'
      },
      {
        title: 'Safety Concern',
        description: 'Fire extinguisher in storage area B is expired. Needs immediate replacement.',
        category: 'safety',
        priority: 'urgent',
        location: 'Storage Area B',
        department: 'Safety',
        reportedBy: dummyUserId,
        reportedByName: 'Field Staff',
        reportedByRole: 'field_staff',
        status: 'in_progress'
      },
      {
        title: 'Facility Issue',
        description: 'Air conditioning in the office is not cooling properly.',
        category: 'facility',
        priority: 'medium',
        location: 'Main Office',
        department: 'Facilities',
        reportedBy: dummyUserId,
        reportedByName: 'Office Staff',
        reportedByRole: 'field_staff',
        status: 'open'
      },
      {
        title: 'IT Support Request',
        description: 'Computer in workstation 5 is running very slow. Needs maintenance.',
        category: 'it',
        priority: 'low',
        location: 'Workstation 5',
        department: 'IT',
        reportedBy: dummyUserId,
        reportedByName: 'Admin Staff',
        reportedByRole: 'field_staff',
        status: 'open'
      },
      {
        title: 'Supply Shortage',
        description: 'Running low on protective gloves in the lab. Need to restock.',
        category: 'supplies',
        priority: 'medium',
        location: 'Lab Supply Room',
        department: 'Laboratory',
        reportedBy: dummyUserId,
        reportedByName: 'Lab Staff',
        reportedByRole: 'lab_staff',
        status: 'resolved',
        resolution: 'Supplies ordered and delivered',
        resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ];

    // Insert sample complaints
    const created = await Complaint.insertMany(complaints);
    console.log(`\n✅ Created ${created.length} sample complaints:`);
    
    created.forEach(complaint => {
      console.log(`  - ${complaint.title} (${complaint.priority}) - ${complaint.status}`);
    });

    console.log('\n✅ Sample complaints created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating sample complaints:', error);
    process.exit(1);
  }
};

createSampleComplaints();
