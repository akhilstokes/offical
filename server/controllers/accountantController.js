const User = require('../models/userModel');
const TaxRecord = require('../models/TaxRecord');
const { logAudit } = require('../services/auditService');
const path = require('path');
const fs = require('fs');

// Get time tracking data
exports.getTimeTracking = async (req, res) => {
  try {
    const { date, department, status } = req.query;

    // Build query
    let matchStage = {};
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      matchStage.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (department && department !== 'all') {
      matchStage.department = department;
    }

    if (status && status !== 'all') {
      matchStage.status = status;
    }

    // Mock time tracking data (replace with actual time tracking collection)
    const timeData = await User.aggregate([
      { $match: { role: { $ne: 'user' }, status: 'active' } },
      {
        $lookup: {
          from: 'attendances',
          localField: '_id',
          foreignField: 'staff',
          as: 'attendance'
        }
      },
      { $unwind: { path: '$attendance', preserveNullAndEmptyArrays: true } },
      { $match: matchStage },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          email: { $first: '$email' },
          department: { $first: '$role' },
          arrivalTime: { $first: '$attendance.arrivalTime' },
          departureTime: { $first: '$attendance.departureTime' },
          status: {
            $first: {
              $cond: {
                if: { $eq: ['$attendance.arrivalTime', null] },
                then: 'absent',
                else: {
                  $cond: {
                    if: { $lte: ['$attendance.arrivalTime', '09:00'] },
                    then: 'on-time',
                    else: 'late'
                  }
                }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          name: 1,
          email: 1,
          department: 1,
          arrivalTime: 1,
          departureTime: 1,
          status: 1
        }
      }
    ]);

    // Calculate summary
    const summary = {
      totalStaff: timeData.length,
      onTime: timeData.filter(d => d.status === 'on-time').length,
      late: timeData.filter(d => d.status === 'late').length,
      overtime: timeData.filter(d => d.status === 'overtime').length,
      earlyDeparture: timeData.filter(d => d.status === 'early-departure').length
    };

    res.json({
      data: timeData,
      summary
    });
  } catch (error) {
    console.error('Error fetching time tracking:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get time tracking summary
exports.getTimeTrackingSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Mock summary data (replace with actual aggregation)
    const summary = {
      totalDays: 30,
      averageArrival: '09:15',
      averageDeparture: '18:30',
      totalLateArrivals: 45,
      totalOvertimeHours: 120,
      totalEarlyDepartures: 12,
      departmentBreakdown: {
        field_staff: { total: 15, onTime: 10, late: 5 },
        lab: { total: 8, onTime: 6, late: 2 },
        delivery: { total: 12, onTime: 8, late: 4 },
        admin: { total: 5, onTime: 4, late: 1 }
      }
    };

    res.json({ data: summary });
  } catch (error) {
    console.error('Error fetching time tracking summary:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get daily financial report
exports.getDailyFinancialReport = async (req, res) => {
  try {
    const { date } = req.query;

    const report = {
      date: date || new Date().toISOString().split('T')[0],
      totalSalaries: 150000,
      totalInvoices: 50000,
      totalPayments: 120000,
      netCashFlow: -30000,
      breakdown: {
        salaries: { paid: 120000, pending: 30000 },
        invoices: { paid: 30000, pending: 20000 },
        other: { paid: 10000, pending: 5000 }
      }
    };

    res.json({ data: report });
  } catch (error) {
    console.error('Error fetching daily financial report:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get monthly financial report
exports.getMonthlyFinancialReport = async (req, res) => {
  try {
    const { month, year } = req.query;

    const report = {
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear(),
      totalSalaries: 4500000,
      totalInvoices: 1500000,
      totalPayments: 3600000,
      netCashFlow: -900000,
      dailyAverages: {
        salaries: 150000,
        invoices: 50000,
        payments: 120000
      },
      trends: {
        salaries: '+5%',
        invoices: '+12%',
        payments: '+8%'
      }
    };

    res.json({ data: report });
  } catch (error) {
    console.error('Error fetching monthly financial report:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get yearly financial report
exports.getYearlyFinancialReport = async (req, res) => {
  try {
    const { year } = req.query;

    const report = {
      year: year || new Date().getFullYear(),
      totalSalaries: 54000000,
      totalInvoices: 18000000,
      totalPayments: 43200000,
      netCashFlow: -10800000,
      quarterlyBreakdown: {
        Q1: { salaries: 13500000, invoices: 4500000, payments: 10800000 },
        Q2: { salaries: 13500000, invoices: 4500000, payments: 10800000 },
        Q3: { salaries: 13500000, invoices: 4500000, payments: 10800000 },
        Q4: { salaries: 13500000, invoices: 4500000, payments: 10800000 }
      },
      monthlyTrends: [
        { month: 'Jan', salaries: 4500000, invoices: 1500000, payments: 3600000 },
        { month: 'Feb', salaries: 4500000, invoices: 1500000, payments: 3600000 },
        { month: 'Mar', salaries: 4500000, invoices: 1500000, payments: 3600000 },
        { month: 'Apr', salaries: 4500000, invoices: 1500000, payments: 3600000 },
        { month: 'May', salaries: 4500000, invoices: 1500000, payments: 3600000 },
        { month: 'Jun', salaries: 4500000, invoices: 1500000, payments: 3600000 },
        { month: 'Jul', salaries: 4500000, invoices: 1500000, payments: 3600000 },
        { month: 'Aug', salaries: 4500000, invoices: 1500000, payments: 3600000 },
        { month: 'Sep', salaries: 4500000, invoices: 1500000, payments: 3600000 },
        { month: 'Oct', salaries: 4500000, invoices: 1500000, payments: 3600000 },
        { month: 'Nov', salaries: 4500000, invoices: 1500000, payments: 3600000 },
        { month: 'Dec', salaries: 4500000, invoices: 1500000, payments: 3600000 }
      ]
    };

    res.json({ data: report });
  } catch (error) {
    console.error('Error fetching yearly financial report:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get staff salary overview
exports.getStaffSalaryOverview = async (req, res) => {
  try {
    const { month, year } = req.query;

    // Mock salary overview data
    const overview = {
      totalStaff: 40,
      totalSalaries: 4500000,
      averageSalary: 112500,
      statusBreakdown: {
        draft: 5,
        approved: 30,
        paid: 35
      },
      departmentBreakdown: {
        field_staff: { count: 15, totalSalary: 1687500 },
        lab: { count: 8, totalSalary: 900000 },
        delivery: { count: 12, totalSalary: 1350000 },
        admin: { count: 5, totalSalary: 562500 }
      },
      topEarners: [
        { name: 'John Doe', department: 'field_staff', salary: 150000 },
        { name: 'Jane Smith', department: 'lab', salary: 120000 },
        { name: 'Mike Johnson', department: 'delivery', salary: 110000 }
      ]
    };

    res.json({ data: overview });
  } catch (error) {
    console.error('Error fetching staff salary overview:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get overtime calculations
exports.getOvertimeCalculations = async (req, res) => {
  try {
    const { month, year } = req.query;

    const overtimeData = {
      pending: [
        {
          id: '1',
          staffName: 'John Doe',
          department: 'field_staff',
          date: '2024-01-15',
          regularHours: 8,
          overtimeHours: 3.5,
          overtimeRate: 1.5,
          overtimeAmount: 5250
        }
      ],
      approved: [
        {
          id: '2',
          staffName: 'Jane Smith',
          department: 'lab',
          date: '2024-01-14',
          regularHours: 8,
          overtimeHours: 2,
          overtimeRate: 1.5,
          overtimeAmount: 3000
        }
      ],
      summary: {
        totalPendingAmount: 5250,
        totalApprovedAmount: 3000,
        totalOvertimeHours: 5.5,
        averageOvertimePerStaff: 2.75
      }
    };

    res.json({ data: overtimeData });
  } catch (error) {
    console.error('Error fetching overtime calculations:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Approve overtime
exports.approveOvertime = async (req, res) => {
  try {
    const { overtimeId } = req.params;
    const { approvedAmount, notes } = req.body;

    // Mock overtime approval
    const overtime = {
      id: overtimeId,
      status: 'approved',
      approvedAmount,
      approvedBy: req.user._id,
      approvedDate: new Date(),
      notes
    };

    // Log audit
    await logAudit({
      action: 'overtime_approved',
      actor: req.user._id,
      actorRole: req.user.role,
      target: overtimeId,
      targetType: 'overtime',
      description: `Overtime approved - Amount: ₹${approvedAmount}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({
      message: 'Overtime approved successfully',
      data: overtime
    });
  } catch (error) {
    console.error('Error approving overtime:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Export time tracking
exports.exportTimeTracking = async (req, res) => {
  try {
    const { startDate, endDate, format } = req.query;

    // Generate CSV data
    const csvData = [
      ['Name', 'Department', 'Date', 'Arrival Time', 'Departure Time', 'Status', 'Overtime Hours'],
      // Add actual data rows here
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=time-tracking-${startDate}-to-${endDate}.csv`);
    res.send(csvData.join('\n'));
  } catch (error) {
    console.error('Error exporting time tracking:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get invoice summary for dashboard
exports.getInvoiceSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    }

    // Get invoice statistics
    const invoiceStats = await Invoice.aggregate([
      { $match: dateFilter.invoiceDate ? { invoiceDate: dateFilter } : {} },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$amountPaid' }
        }
      }
    ]);

    // Get payment statistics
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

    const paymentData = paymentStats[0] || { totalPayments: 0, totalAmount: 0, completedPayments: 0 };

    res.json({
      data: {
        period: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
        invoiceStats,
        paymentStats: paymentData
      }
    });
  } catch (error) {
    console.error('Error fetching invoice summary:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get payment reconciliation report
exports.getPaymentReconciliationReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    }

    // Get unreconciled payments
    const unreconciledPayments = await AccountantPayment.find({
      ...dateFilter.paymentDate ? { paymentDate: dateFilter } : {},
      reconciled: false
    })
      .sort({ paymentDate: -1 })
      .populate('invoiceId', 'invoiceNumber vendor totalAmount')
      .populate('createdBy', 'name email');

    // Get recent reconciliations
    const recentReconciliations = await AccountantPayment.find({
      ...dateFilter.reconciledDate ? { reconciledDate: dateFilter } : {},
      reconciled: true
    })
      .sort({ reconciledDate: -1 })
      .limit(20)
      .populate('invoiceId', 'invoiceNumber vendor totalAmount')
      .populate('reconciledBy', 'name email');

    res.json({
      data: {
        unreconciledCount: unreconciledPayments.length,
        unreconciledPayments,
        recentReconciliations
      }
    });
  } catch (error) {
    console.error('Error fetching payment reconciliation report:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
// Tax Filing CRUD
exports.getTaxData = async (req, res) => {
  try {
    const { month, year } = req.query;
    const records = await TaxRecord.find({ month, year });

    // Separate by type
    const gst = records.filter(r => r.type === 'gst');
    const compliance = records.filter(r => r.type === 'compliance');
    const reminders = records.filter(r => r.type === 'reminder');

    res.json({ data: { gst, compliance, reminders } });
  } catch (error) {
    console.error('Error fetching tax data:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.addTaxRecord = async (req, res) => {
  try {
    const record = await TaxRecord.create(req.body);
    await logAudit({
      action: 'tax_record_created',
      actor: req.user._id,
      description: `Created tax record: ${record.type}`,
      target: record._id,
      targetType: 'tax_record'
    });
    res.status(201).json({ data: record });
  } catch (error) {
    console.error('Error adding tax record:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.updateTaxRecord = async (req, res) => {
  try {
    const record = await TaxRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logAudit({
      action: 'tax_record_updated',
      actor: req.user._id,
      description: `Updated tax record: ${record.type}`,
      target: record._id,
      targetType: 'tax_record'
    });
    res.json({ data: record });
  } catch (error) {
    console.error('Error updating tax record:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.deleteTaxRecord = async (req, res) => {
  try {
    await TaxRecord.findByIdAndDelete(req.params.id);
    await logAudit({
      action: 'tax_record_deleted',
      actor: req.user._id,
      description: `Deleted tax record`,
      target: req.params.id,
      targetType: 'tax_record'
    });
    res.json({ message: 'Record deleted' });
  } catch (error) {
    console.error('Error deleting tax record:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// --- DOCUMENT MANAGEMENT ---
const AccountantDocument = require('../models/accountantDocumentModel');

exports.getDocuments = async (req, res) => {
  try {
    const documents = await AccountantDocument.find()
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ data: documents });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    console.log('Upload Request Received:');
    console.log('File:', req.file ? req.file.originalname : 'No file');
    console.log('Body:', req.body);

    if (!req.file) {
      console.error('Upload failed: No file provided in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { category, description, reference, date } = req.body;
    
    // Normalize category to lowercase and validate against allowed enum values
    const allowedCategories = ['invoice', 'bill', 'receipt', 'contract', 'tax', 'bank', 'other'];
    const normalizedCategory = (category || 'other').toLowerCase();
    const finalCategory = allowedCategories.includes(normalizedCategory) ? normalizedCategory : 'other';

    const document = await AccountantDocument.create({
      title: req.file.originalname,
      category: finalCategory,
      description,
      reference,
      date: date ? new Date(date) : undefined,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: req.user._id
    });

    await logAudit({
      action: 'document_uploaded',
      actor: req.user._id,
      description: `Uploaded document: ${req.file.originalname}`,
      target: document._id,
      targetType: 'accountant_document'
    });

    res.status(201).json({ 
      success: true,
      message: 'Document uploaded successfully',
      data: document 
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const document = await AccountantDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const filePath = path.join(__dirname, '..', document.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.download(filePath, document.fileName);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.addDocument = async (req, res) => {
  try {
    const { title, category, description, fileUrl, fileName } = req.body;
    const document = await AccountantDocument.create({
      title,
      category,
      description,
      fileUrl,
      fileName,
      uploadedBy: req.user._id
    });

    await logAudit({
      action: 'document_uploaded',
      actor: req.user._id,
      description: `Uploaded document: ${title}`,
      target: document._id,
      targetType: 'accountant_document'
    });

    res.status(201).json({ data: document });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const document = await AccountantDocument.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ data: document });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await AccountantDocument.findById(req.params.id);
    if (document && document.fileUrl) {
      const filePath = path.join(__dirname, '..', document.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await AccountantDocument.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
