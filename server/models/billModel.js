const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  // Company Information (snapshot at time of bill creation)
  companyName: { type: String, default: 'Holy Family Polymers' },
  companyAddress: { type: String, default: 'Kooroppada, P.O. - 686 502' },
  companyGST: { type: String, default: '32AAHFH5388M1ZX' },
  companyPhone: { type: String },
  companyEmail: { type: String },
  companyLogoUrl: { type: String },

  // Bill Information
  billNumber: {
    type: String,
    required: false,
    unique: true
  },

  // Customer Information
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: false, default: 'N/A' },

  // Sample & Lab Information
  sampleId: { type: String },
  labStaff: { type: String },
  drcPercent: { type: Number, required: true },

  // Barrel Information
  barrelCount: { type: Number, required: true, min: 1 },

  // Latex & Calculation Data
  latexVolume: { type: Number, required: true }, // in Liters
  latexWeight: { type: Number, required: true }, // in KG (same as volume for latex)
  dryRubber: { type: Number, required: true }, // in KG
  marketRate: { type: Number, required: true }, // ₹/100KG
  perKgRate: { type: Number, required: true }, // ₹/KG

  // Billing Amount
  totalAmount: { type: Number, required: true },
  perBarrelAmount: { type: Number, required: true },

  // Workflow Status
  status: {
    type: String,
    enum: ['pending', 'calculated', 'manager_verified', 'approved', 'paid', 'rejected'],
    default: 'pending'
  },

  // Timestamps & Users
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: { type: Date },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: { type: Date },

  // Payment Information
  paymentDate: { type: Date },
  paymentMethod: { type: String },
  paymentReference: { type: String },

  // Bank Details Used for this specific payment (snapshot)
  paymentBankName: { type: String },
  paymentAccountNumber: { type: String },
  paymentIfscCode: { type: String },

  // Notes
  accountantNotes: { type: String },
  managerNotes: { type: String },
  rejectionReason: { type: String },

  // Signatures (auto-captured when bill is created/verified)
  accountantSignature: { type: String }, // Accountant's name (auto-filled from createdBy)
  accountantSignatureUrl: { type: String }, // Optional: URL to signature image
  managerSignature: { type: String }, // Manager's name (auto-filled from verifiedBy)
  managerSignatureUrl: { type: String }, // Optional: URL to signature image

  // Link to user (customer)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

}, { timestamps: true });

// Generate bill number before saving
billSchema.pre('save', async function (next) {
  if (!this.billNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Find the last bill number for this month
    const lastBill = await this.constructor.findOne({
      billNumber: new RegExp(`^BILL-${year}${month}-`)
    }).sort({ billNumber: -1 });

    let sequence = 1;
    if (lastBill) {
      const lastSequence = parseInt(lastBill.billNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    this.billNumber = `BILL-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Bill', billSchema);
