const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    // Basic Information
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: false // Optional for backward compatibility
    },
    vendor: {
      type: String,
      required: true
    },
    customerPAN: {
      type: String,
      trim: true
    },
    invoiceDate: {
      type: Date,
      required: true
    },
    dueDate: {
      type: Date,
      required: true
    },

    // Purchase Bill Specific Fields
    vehicleNumber: {
      type: String,
      trim: true
    },
    driverName: {
      type: String,
      trim: true
    },
    driverPhone: {
      type: String,
      trim: true
    },
    vehicleType: {
      type: String,
      enum: ['Company', 'Outside'],
      default: 'Company'
    },
    distance: {
      type: Number,
      min: 0
    },
    drc: {
      type: Number,
      min: 0,
      max: 100
    },
    placeOfSupply: {
      type: String,
      trim: true
    },
    supplyDate: {
      type: Date
    },
    invoiceType: {
      type: String,
      enum: ['standard', 'purchase_bill'],
      default: 'standard'
    },

    // Line Items
    items: [{
      description: String,
      quantity: Number,
      unitPrice: Number,
      rate: Number,
      amount: Number,
      taxRate: Number,
      taxAmount: Number
    }],

    // Totals
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    // Status
    status: {
      type: String,
      enum: ['pending', 'approved', 'partially_paid', 'paid'],
      default: 'pending'
    },

    // Payment Tracking
    amountPaid: {
      type: Number,
      default: 0,
      min: 0
    },
    paymentHistory: [{
      date: Date,
      amount: Number,
      method: String,
      reference: String,
      recordedBy: mongoose.Schema.Types.ObjectId
    }],

    // Approval
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedDate: Date,

    // Audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Index for efficient queries
invoiceSchema.index({ vendor: 1, invoiceDate: -1 });
invoiceSchema.index({ status: 1, dueDate: 1 });
invoiceSchema.index({ branch: 1, invoiceDate: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
