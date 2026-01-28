const mongoose = require('mongoose');

const barrelSchema = new mongoose.Schema({
  barrelId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true
  },
  capacity: {
    type: String,
    required: true
  },
  material: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['available', 'in-use', 'maintenance', 'assigned', 'pending_sale', 'sold', 'in-storage'],
    default: 'available'
  },
  registeredBy: {
    type: String,
    required: true
  },
  registeredById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registeredDate: {
    type: Date,
    default: Date.now
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDate: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Barrel', barrelSchema);
