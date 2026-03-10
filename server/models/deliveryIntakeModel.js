const mongoose = require('mongoose');

const deliveryIntakeSchema = new mongoose.Schema({
  // Unique request ID (e.g., SELL-2026-0001)
  requestNumber: { 
    type: String, 
    unique: true,
    sparse: true
  },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true }, // Made mandatory for sell barrel requests
  barrelCount: { type: Number, required: true, min: 0 },
  notes: { type: String },
  companyBarrel: { type: String },
  status: { type: String, enum: ['pending', 'assigned', 'manager_verified', 'approved', 'rejected', 'billed'], default: 'pending' },
  pricePerBarrel: { type: Number },
  totalAmount: { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Owner of the barrels being sold (optional for backward compatibility)
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  linkedBillId: { type: mongoose.Schema.Types.ObjectId },
  // New fields for delivery workflow
  barrelIds: [{ type: String }], // Array of barrel IDs (optional, handled by field staff)
  taskId: { type: String }, // Reference to delivery task
  requestId: { type: String }, // Reference to sell request from manager
  arrivalTime: { type: Date }, // Time when barrels arrived
  // Optional geolocation for where the request was created
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: undefined }, // [lng, lat]
  },
  locationAccuracy: { type: Number }, // meters
}, { timestamps: true });

// Generate unique request number before saving
deliveryIntakeSchema.pre('save', async function(next) {
  if (!this.requestNumber && this.isNew) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Find the last request number for this month
    const lastRequest = await this.constructor.findOne({
      requestNumber: new RegExp(`^SELL-${year}${month}-`)
    }).sort({ requestNumber: -1 });
    
    let sequence = 1;
    if (lastRequest && lastRequest.requestNumber) {
      const lastSequence = parseInt(lastRequest.requestNumber.split('-')[2]);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
    
    this.requestNumber = `SELL-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('DeliveryIntake', deliveryIntakeSchema);
