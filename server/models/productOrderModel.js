const mongoose = require('mongoose');

const ProductOrderSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productType: { type: String, required: true }, // '100kg_pack', '200kg_pack', '500kg_pack', '1ton_bulk'
    packSizeName: { type: String, required: true }, // human readable equivalent
    quantity: { type: Number, required: true, min: 1 },
    paymentMethod: { type: String, required: true }, // 'UPI', 'Card', 'COD', 'Bank Transfer'
    deliveryAddress: { type: String, required: true },
    panNumber: { type: String, required: true }, // PAN number for tax compliance
    totalAmount: { type: Number }, // Optional during request phase

    status: {
        type: String,
        enum: [
            'REQUESTED',
            'BILLED',
            'APPROVED',
            'DELIVERED',
            'CANCELLED'
        ],
        default: 'REQUESTED'
    },

    driverName: { type: String },
    driverPhone: { type: String },
    vehicleNumber: { type: String },

    assignedDeliveryStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },

    requestedAt: { type: Date, default: Date.now },
    assignedAt: { type: Date },
    deliveredAt: { type: Date },
    billedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('ProductOrder', ProductOrderSchema);
