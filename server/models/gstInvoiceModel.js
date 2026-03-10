const mongoose = require('mongoose');

const gstInvoiceSchema = new mongoose.Schema({
  // Invoice Information
  invoiceNumber: {
    type: String,
    unique: true
  },
  invoiceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  supplyDate: {
    type: Date,
    required: true
  },
  
  // Reverse Charge
  reverseCharge: {
    type: String,
    enum: ['Yes', 'No', 'Nil'],
    default: 'No'
  },
  
  // Vendor/Supplier Details
  vendorName: {
    type: String,
    required: true
  },
  placeOfSupply: {
    type: String,
    required: true
  },
  
  // Customer/Receiver Details
  customerName: {
    type: String,
    required: true
  },
  customerAddress: {
    type: String,
    required: true
  },
  customerGSTIN: {
    type: String
  },
  customerState: {
    type: String,
    required: true
  },
  customerStateCode: {
    type: String,
    required: true
  },
  
  // Transportation Details
  transportationMode: {
    type: String,
    enum: ['Road', 'Rail', 'Air', 'Ship'],
    default: 'Road'
  },
  vehicleNumber: {
    type: String
  },
  driverName: {
    type: String
  },
  driverPhone: {
    type: String
  },
  distance: {
    type: Number
  },
  transporterName: {
    type: String
  },
  transporterGSTIN: {
    type: String
  },
  
  // Items
  items: [{
    slNo: Number,
    description: {
      type: String,
      required: true
    },
    hsnSac: {
      type: String,
      required: true
    },
    gstRate: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      default: 'KG'
    },
    rate: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  
  // Tax Calculation
  taxableValue: {
    type: Number,
    required: true
  },
  cgst: {
    type: Number,
    default: 0
  },
  sgst: {
    type: Number,
    default: 0
  },
  igst: {
    type: Number,
    default: 0
  },
  totalTax: {
    type: Number,
    required: true
  },
  grandTotal: {
    type: Number,
    required: true
  },
  amountInWords: {
    type: String,
    required: true
  },
  
  // e-Way Bill
  eWayBillNumber: {
    type: String
  },
  eWayBillDate: {
    type: Date
  },
  eWayBillValidUpto: {
    type: Date
  },
  
  // Status
  status: {
    type: String,
    enum: ['Draft', 'Generated', 'Sent', 'Paid', 'Cancelled'],
    default: 'Draft'
  },
  
  // Created By
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
  
}, { timestamps: true });

// Auto-increment invoice number
gstInvoiceSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    try {
      const lastInvoice = await this.constructor.findOne().sort({ createdAt: -1 });
      const lastNumber = lastInvoice ? parseInt(lastInvoice.invoiceNumber.split('-')[1]) : 0;
      this.invoiceNumber = `INV-${String(lastNumber + 1).padStart(6, '0')}`;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('GSTInvoice', gstInvoiceSchema);
