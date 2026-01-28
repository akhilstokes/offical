const mongoose = require('mongoose');

const barrelRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    address: { type: String, default: '' }, // Optional for barrel requests
    notes: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'fulfilled', 'assigned'], default: 'pending', index: true },
    adminNotes: { type: String, default: '' },
    // Barrel assignment fields
    assignedBarrels: [{ type: String }],
    barrelSource: { type: String, enum: ['returned', 'inventory'] },
    assignedAt: { type: Date },
    // Delivery assignment fields
    deliveryStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveryDate: { type: Date },
    deliveryLocation: { type: String },
    deliveryStatus: { type: String, enum: ['pending', 'in_transit', 'delivered'], default: 'pending' },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BarrelRequest', barrelRequestSchema);


