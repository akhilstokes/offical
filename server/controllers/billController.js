const Bill = require('../models/billModel');
const User = require('../models/userModel');
const Notification = require('../models/Notification');
const CompanySettings = require('../models/companySettingsModel');

// Create a new bill (Accountant)
exports.createBill = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      sampleId,
      labStaff,
      drcPercent,
      barrelCount,
      latexVolume,
      marketRate,
      accountantNotes,
      userId
    } = req.body;

    // Validate required fields
    if (!customerName || !drcPercent || !barrelCount || !latexVolume || !marketRate) {
      return res.status(400).json({
        message: 'Missing required fields: customerName, drcPercent, barrelCount, latexVolume, marketRate'
      });
    }

    // Fetch company settings
    let companySettings = await CompanySettings.findOne();

    // If no company settings exist, create default
    if (!companySettings) {
      companySettings = await CompanySettings.create({
        companyName: 'Holy Family Polymers',
        address: 'Kooroppada, P.O. - 686 502',
        gstNumber: '32AAHFH5388M1ZX',
        registrationNumber: 'M142389'
      });
    }

    // Calculate billing amounts
    const latexWeight = parseFloat(latexVolume); // 1 liter = 1 kg for latex
    const dryRubber = latexWeight * (parseFloat(drcPercent) / 100);
    const perKgRate = parseFloat(marketRate) / 100;
    const totalAmount = dryRubber * perKgRate;
    const perBarrelAmount = totalAmount / parseInt(barrelCount);

    // Generate bill number with retry for race-condition safety
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    let bill = null;
    let retries = 3;

    while (retries > 0) {
      try {
        // Find the last bill number for this month
        const lastBill = await Bill.findOne({
          billNumber: new RegExp(`^BILL-${year}${month}-`)
        }).sort({ billNumber: -1 });

        let sequence = 1;
        if (lastBill) {
          const lastSequence = parseInt(lastBill.billNumber.split('-')[2]);
          sequence = lastSequence + 1;
        }

        const billNumber = `BILL-${year}${month}-${String(sequence).padStart(4, '0')}`;

        // Create bill with company information snapshot
        bill = await Bill.create({
          // Company Information (snapshot)
          companyName: companySettings.companyName,
          companyAddress: companySettings.address,
          companyGST: companySettings.gstNumber,
          companyPhone: companySettings.phone,
          companyEmail: companySettings.email,
          companyLogoUrl: companySettings.logoUrl,

          // Bill details
          billNumber,
          customerName,
          customerPhone,
          sampleId,
          labStaff,
          drcPercent: parseFloat(drcPercent),
          barrelCount: parseInt(barrelCount),
          latexVolume: parseFloat(latexVolume),
          latexWeight,
          dryRubber,
          marketRate: parseFloat(marketRate),
          perKgRate,
          totalAmount,
          perBarrelAmount,
          createdBy: req.user._id,
          accountantNotes,
          userId,
          status: 'calculated', // Bill is calculated by accountant, ready for manager verification
          // Auto-add accountant signature
          accountantSignature: req.user.name || req.user.email,
          accountantSignatureUrl: req.user.signatureUrl || null
        });

        console.log(`✅ Bill ${billNumber} created successfully for ${customerName}`);
        break; // Success, exit retry loop
      } catch (createError) {
        // If duplicate key error on billNumber, retry with next sequence
        if (createError.code === 11000 && createError.keyPattern?.billNumber) {
          retries--;
          console.warn(`⚠️ Duplicate bill number, retrying... (${retries} attempts left)`);
          continue;
        }
        throw createError; // Re-throw if it's a different error
      }
    }

    if (!bill) {
      return res.status(500).json({ message: 'Failed to generate unique bill number. Please try again.' });
    }

    // Send notification to all managers
    try {
      const managers = await User.find({ role: 'manager' });

      const notifications = managers.map(manager => ({
        userId: manager._id,
        role: 'manager',
        title: '💰 New Bill Generated',
        message: `Bill ${billNumber} for ${customerName} (₹${totalAmount.toFixed(2)}) is pending verification`,
        link: `/manager/bills/${bill._id}`,
        read: false,
        meta: {
          billId: bill._id,
          billNumber: billNumber,
          customerName: customerName,
          totalAmount: totalAmount,
          createdBy: req.user.name || req.user.email
        }
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        console.log(`✅ Sent bill notification to ${notifications.length} manager(s)`);
      }
    } catch (notifError) {
      console.error('⚠️ Failed to send notifications:', notifError.message);
      // Don't fail the bill creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Bill created successfully and sent to manager for verification',
      bill
    });
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({
      message: 'Failed to create bill',
      error: error.message
    });
  }
};

// Get bills for accountant
exports.getAccountantBills = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { createdBy: req.user._id };
    if (status) query.status = status;

    const bills = await Bill.find(query)
      .populate('verifiedBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Bill.countDocuments(query);

    res.json({
      success: true,
      bills,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get accountant bills error:', error);
    res.status(500).json({
      message: 'Failed to fetch bills',
      error: error.message
    });
  }
};

// Get pending bills for manager verification
exports.getManagerPendingBills = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const bills = await Bill.find({ status: { $in: ['pending', 'calculated'] } })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Bill.countDocuments({ status: { $in: ['pending', 'calculated'] } });

    res.json({
      success: true,
      bills,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get manager pending bills error:', error);
    res.status(500).json({
      message: 'Failed to fetch pending bills',
      error: error.message
    });
  }
};

// Get all bills for manager (history)
exports.getManagerAllBills = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const bills = await Bill.find(query)
      .populate('createdBy', 'name email')
      .populate('verifiedBy', 'name email')
      .populate('userId', 'name email phoneNumber')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Bill.countDocuments(query);

    res.json({
      success: true,
      bills,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get manager all bills error:', error);
    res.status(500).json({
      message: 'Failed to fetch bills',
      error: error.message
    });
  }
};

// Verify bill (Manager)
exports.verifyBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { managerNotes } = req.body;

    const bill = await Bill.findById(id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (bill.status !== 'pending') {
      return res.status(400).json({
        message: 'Bill is not in pending status'
      });
    }

    bill.status = 'manager_verified';
    bill.verifiedBy = req.user._id;
    bill.verifiedAt = new Date();
    if (managerNotes) bill.managerNotes = managerNotes;

    // Auto-add manager signature
    bill.managerSignature = req.user.name || req.user.email;
    bill.managerSignatureUrl = req.user.signatureUrl || null;

    await bill.save();

    // Populate for response
    await bill.populate('createdBy', 'name email');
    await bill.populate('verifiedBy', 'name email');

    res.json({
      success: true,
      message: 'Bill verified successfully',
      bill
    });
  } catch (error) {
    console.error('Verify bill error:', error);
    res.status(500).json({
      message: 'Failed to verify bill',
      error: error.message
    });
  }
};

// Reject bill (Manager)
exports.rejectBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        message: 'Rejection reason is required'
      });
    }

    const bill = await Bill.findById(id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    if (bill.status !== 'pending') {
      return res.status(400).json({
        message: 'Bill is not in pending status'
      });
    }

    bill.status = 'rejected';
    bill.verifiedBy = req.user._id;
    bill.verifiedAt = new Date();
    bill.rejectionReason = rejectionReason;

    await bill.save();

    // Populate for response
    await bill.populate('createdBy', 'name email');
    await bill.populate('verifiedBy', 'name email');

    res.json({
      success: true,
      message: 'Bill rejected',
      bill
    });
  } catch (error) {
    console.error('Reject bill error:', error);
    res.status(500).json({
      message: 'Failed to reject bill',
      error: error.message
    });
  }
};

// Get user bills
exports.getUserBills = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {
      userId: req.user._id,
      status: { $in: ['manager_verified', 'approved', 'paid'] }
    };

    if (status) query.status = status;

    const bills = await Bill.find(query)
      .populate('createdBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Bill.countDocuments(query);

    res.json({
      success: true,
      bills,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get user bills error:', error);
    res.status(500).json({
      message: 'Failed to fetch bills',
      error: error.message
    });
  }
};

// Get bill by ID
exports.getBillById = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await Bill.findById(id)
      .populate('createdBy', 'name email')
      .populate('verifiedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('userId', 'name email phone');

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    res.json({
      success: true,
      bill
    });
  } catch (error) {
    console.error('Get bill by ID error:', error);
    res.status(500).json({
      message: 'Failed to fetch bill',
      error: error.message
    });
  }
};

// Get all bills (Admin)
exports.getAllBills = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const bills = await Bill.find(query)
      .populate('createdBy', 'name email')
      .populate('verifiedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Bill.countDocuments(query);

    res.json({
      success: true,
      bills,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get all bills error:', error);
    res.status(500).json({
      message: 'Failed to fetch bills',
      error: error.message
    });
  }
};

// Approve and Pay bill (Manager/Accountant)
exports.approveAndPayBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { managerNotes, paymentMethod, paymentReference, bankDetails } = req.body;

    const bill = await Bill.findById(id);

    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Manager/Accountant can approve from 'pending', 'calculated', or 'manager_verified'
    if (!['pending', 'manager_verified', 'calculated'].includes(bill.status)) {
      return res.status(400).json({ message: `Cannot approve a bill with status '${bill.status}'` });
    }

    bill.status = 'paid';
    bill.approvedBy = req.user._id;
    bill.approvedAt = new Date();
    bill.paymentDate = new Date();
    bill.paymentMethod = paymentMethod || 'Bank Transfer';
    bill.paymentReference = paymentReference || `PAY-${Date.now()}`;

    // Snapshot bank details if provided, or fetch from linked user if available
    if (bankDetails) {
      bill.paymentBankName = bankDetails.bankName || bankDetails.paymentBankName;
      bill.paymentAccountNumber = bankDetails.accountNumber || bankDetails.paymentAccountNumber;
      bill.paymentIfscCode = bankDetails.ifscCode || bankDetails.paymentIfscCode;
    } else if (bill.userId) {
      // If no bank details provided in request, try to fetch from the linked user
      try {
        const user = await User.findById(bill.userId);
        if (user) {
          bill.paymentBankName = bill.paymentBankName || user.bankName;
          bill.paymentAccountNumber = bill.paymentAccountNumber || user.accountNumber;
          bill.paymentIfscCode = bill.paymentIfscCode || user.ifscCode;
          console.log(`ℹ️ Auto-filled bank details from user ${user.name} for bill ${bill.billNumber}`);
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch user bank details for snapshot:', err.message);
      }
    }

    if (managerNotes) bill.managerNotes = managerNotes;

    await bill.save();

    // Populate for response
    await bill.populate('createdBy', 'name email');
    await bill.populate('verifiedBy', 'name email');
    await bill.populate('approvedBy', 'name email');
    await bill.populate('userId', 'name email phoneNumber');

    res.json({
      success: true,
      message: 'Bill approved and marked as paid successfully',
      bill
    });
  } catch (error) {
    console.error('Approve and pay bill error:', error);
    res.status(500).json({
      message: 'Failed to approve and pay bill',
      error: error.message
    });
  }
};
