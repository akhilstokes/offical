const mongoose = require('mongoose');

const salaryRecordSchema = new mongoose.Schema({
  staffMember: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  period: {
    type: String,
    required: true
  },
  // Attendance Data
  totalDays: {
    type: Number,
    default: 0
  },
  presentDays: {
    type: Number,
    default: 0
  },
  absentDays: {
    type: Number,
    default: 0
  },
  leaveDays: {
    type: Number,
    default: 0
  },
  // Salary Components
  basicSalary: {
    type: Number,
    required: true,
    default: 0
  },
  medicalAllowance: {
    type: Number,
    default: 0
  },
  transportationAllowance: {
    type: Number,
    default: 0
  },
  overtime: {
    type: Number,
    default: 0
  },
  bonus: {
    type: Number,
    default: 0
  },
  grossSalary: {
    type: Number,
    required: true
  },
  // Deductions
  deductions: {
    tax: { type: Number, default: 0 },
    providentFund: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    loanDeduction: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    required: true
  },
  // Payment Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'rejected'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'cheque', 'upi'],
    default: 'bank_transfer'
  },
  transactionId: {
    type: String
  },
  remarks: {
    type: String
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Payslip Notification Status
  payslipSent: {
    type: Boolean,
    default: false
  },
  payslipSentAt: {
    type: Date
  },
  payslipSentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index for unique salary records per staff per month
salaryRecordSchema.index({ staffMember: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('SalaryRecord', salaryRecordSchema);
