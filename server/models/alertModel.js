const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    index: true
  },
  alertType: {
    type: String,
    enum: ['Insurance', 'Pollution'],
    required: true
  },
  severity: {
    type: String,
    enum: ['Warning', 'Critical'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  expiryDate: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
alertSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
alertSchema.index({ vehicleId: 1, alertType: 1 });

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;
