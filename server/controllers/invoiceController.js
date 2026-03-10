const Invoice = require('../models/invoiceModel');
const AccountantPayment = require('../models/accountantPaymentModel');
const AccountantAuditLog = require('../models/accountantAuditLogModel');
const { logAudit } = require('../services/auditService');

// Create Invoice
exports.createInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber, vendor, invoiceDate, dueDate, items,
      subtotal, taxAmount, totalAmount,
      vehicleNumber, vehicleType, distance, placeOfSupply
    } = req.body;

    // Validate required fields
    if (!invoiceNumber || !vendor || !totalAmount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check for duplicate invoice number
    const existing = await Invoice.findOne({ invoiceNumber });
    if (existing) {
      return res.status(400).json({ message: 'Invoice number already exists' });
    }

    const invoice = await Invoice.create({
      invoiceNumber,
      vendor,
      invoiceDate,
      dueDate,
      items,
      subtotal,
      taxAmount,
      totalAmount,
      vehicleNumber,
      vehicleType,
      distance,
      placeOfSupply,
      createdBy: req.user._id
    });

    // Log audit
    await logAudit({
      action: 'invoice_created',
      actor: req.user._id,
      actorRole: req.user.role,
      target: invoice._id,
      targetType: 'invoice',
      description: `Invoice ${invoiceNumber} created for ${vendor}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      message: 'Invoice created successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Approve Invoice
exports.approveInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (invoice.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending invoices can be approved' });
    }

    const before = invoice.toObject();

    invoice.status = 'approved';
    invoice.approvedBy = req.user._id;
    invoice.approvedDate = new Date();
    invoice.updatedBy = req.user._id;

    await invoice.save();

    // Log audit
    await logAudit({
      action: 'invoice_approved',
      actor: req.user._id,
      actorRole: req.user.role,
      target: invoice._id,
      targetType: 'invoice',
      changes: { before, after: invoice.toObject() },
      description: `Invoice ${invoice.invoiceNumber} approved`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      message: 'Invoice approved successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Error approving invoice:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Record Payment
exports.recordPayment = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { amount, paymentMethod, paymentReference, paymentDate } = req.body;

    if (!amount || !paymentMethod) {
      return res.status(400).json({ message: 'Amount and payment method are required' });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const before = invoice.toObject();

    // Update payment tracking
    invoice.paymentHistory.push({
      date: paymentDate || new Date(),
      amount,
      method: paymentMethod,
      reference: paymentReference,
      recordedBy: req.user._id
    });

    invoice.amountPaid += amount;

    // Update status
    if (invoice.amountPaid >= invoice.totalAmount) {
      invoice.status = 'paid';
    } else if (invoice.amountPaid > 0) {
      invoice.status = 'partially_paid';
    }

    invoice.updatedBy = req.user._id;
    await invoice.save();

    // Create payment record
    await AccountantPayment.create({
      invoiceId: invoice._id,
      amount,
      paymentMethod,
      paymentReference,
      paymentDate: paymentDate || new Date(),
      status: 'completed',
      createdBy: req.user._id
    });

    // Log audit
    await logAudit({
      action: 'payment_recorded',
      actor: req.user._id,
      actorRole: req.user.role,
      target: invoice._id,
      targetType: 'invoice',
      changes: { before, after: invoice.toObject() },
      description: `Payment of ₹${amount} recorded for invoice ${invoice.invoiceNumber}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      message: 'Payment recorded successfully',
      data: {
        invoiceId: invoice._id,
        amountPaid: invoice.amountPaid,
        remainingAmount: invoice.totalAmount - invoice.amountPaid,
        status: invoice.status
      }
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get Invoice Details
exports.getInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findById(invoiceId)
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('paymentHistory.recordedBy', 'name email');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Permission check: Admin/Manager/Accountant or the creator of the invoice
    const isSpecialist = ['admin', 'manager', 'accountant'].includes(req.user.role);
    const isCreator = invoice.createdBy._id.toString() === req.user._id.toString();

    if (!isSpecialist && !isCreator) {
      return res.status(403).json({ message: 'Access denied: You can only view your own bills' });
    }

    res.json({ data: invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get My Invoices (for customers)
exports.getMyInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const invoices = await Invoice.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments({ createdBy: req.user._id });

    res.json({
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching my invoices:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get All Invoices with Filters
exports.getInvoices = async (req, res) => {
  try {
    const { status, vendor, invoiceType, startDate, endDate, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (vendor) filter.vendor = new RegExp(vendor, 'i');
    if (invoiceType) filter.invoiceType = invoiceType;
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const invoices = await Invoice.find(filter)
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email');

    const total = await Invoice.countDocuments(filter);

    res.json({
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get Payment History
exports.getPaymentHistory = async (req, res) => {
  try {
    const { startDate, endDate, status, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) filter.paymentDate.$lte = new Date(endDate);
    }
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const payments = await AccountantPayment.find(filter)
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('invoiceId', 'invoiceNumber vendor totalAmount')
      .populate('createdBy', 'name email');

    const total = await AccountantPayment.countDocuments(filter);

    res.json({
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get Financial Summary
exports.getFinancialSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    }

    // Invoice summary
    const invoiceStats = await Invoice.aggregate([
      { $match: dateFilter.invoiceDate ? { invoiceDate: dateFilter } : {} },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$amountPaid' },
          pendingAmount: { $sum: { $subtract: ['$totalAmount', '$amountPaid'] } }
        }
      }
    ]);

    // Payment summary
    const paymentStats = await AccountantPayment.aggregate([
      { $match: dateFilter.paymentDate ? { paymentDate: dateFilter } : {} },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          completedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ]);

    const invoiceData = invoiceStats[0] || { totalInvoices: 0, totalAmount: 0, totalPaid: 0, pendingAmount: 0 };
    const paymentData = paymentStats[0] || { totalPayments: 0, totalAmount: 0, completedPayments: 0 };

    res.json({
      data: {
        period: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
        invoices: {
          total: invoiceData.totalInvoices,
          totalAmount: invoiceData.totalAmount,
          paidAmount: invoiceData.totalPaid,
          pendingAmount: invoiceData.pendingAmount,
          paymentRate: invoiceData.totalAmount > 0 ? (invoiceData.totalPaid / invoiceData.totalAmount * 100).toFixed(2) : 0
        },
        payments: {
          total: paymentData.totalPayments,
          totalAmount: paymentData.totalAmount,
          completed: paymentData.completedPayments,
          completionRate: paymentData.totalPayments > 0 ? (paymentData.completedPayments / paymentData.totalPayments * 100).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
