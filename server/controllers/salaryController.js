const SalaryRecord = require('../models/salaryModel');
const User = require('../models/userModel');
const Attendance = require('../models/attendanceModel');

// Calculate wages based on attendance
exports.calculateWages = async (req, res) => {
  try {
    const { staffId, month, year } = req.body;

    // Get staff details
    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Get attendance records for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const attendanceRecords = await Attendance.find({
      userId: staffId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate attendance stats
    const totalDays = endDate.getDate();
    const presentDays = attendanceRecords.filter(a => a.status === 'present').length;
    const absentDays = attendanceRecords.filter(a => a.status === 'absent').length;
    const leaveDays = attendanceRecords.filter(a => a.status === 'leave').length;

    // Calculate salary based on salary type
    let basicSalary = 0;
    if (staff.salaryType === 'monthly') {
      // Monthly salary - fixed amount regardless of attendance
      basicSalary = staff.baseSalary || 0;
    } else {
      // Daily wage - calculate based on present days
      const dailyRate = staff.baseSalary || 500;
      basicSalary = presentDays * dailyRate;
    }

    const allowances = staff.allowances || 0;
    const overtime = staff.overtime || 0;
    const bonus = staff.bonus || 0;
    
    const grossSalary = basicSalary + allowances + overtime + bonus;

    // Calculate deductions
    const tax = grossSalary * 0.05; // 5% tax
    const providentFund = grossSalary * 0.12; // 12% PF
    const insurance = staff.insurance || 0;
    const loanDeduction = staff.loanDeduction || 0;
    const otherDeductions = staff.otherDeductions || 0;

    const totalDeductions = tax + providentFund + insurance + loanDeduction + otherDeductions;
    const netSalary = grossSalary - totalDeductions;

    res.json({
      success: true,
      data: {
        staffMember: staff,
        attendance: {
          totalDays,
          presentDays,
          absentDays,
          leaveDays
        },
        salary: {
          basicSalary,
          allowances,
          overtime,
          bonus,
          grossSalary,
          deductions: {
            tax,
            providentFund,
            insurance,
            loanDeduction,
            other: otherDeductions
          },
          totalDeductions,
          netSalary
        }
      }
    });
  } catch (error) {
    console.error('Calculate wages error:', error);
    res.status(500).json({ message: 'Error calculating wages', error: error.message });
  }
};

// Generate salary record
exports.generateSalaryRecord = async (req, res) => {
  try {
    const { 
      staffId, 
      month, 
      year,
      startDate,
      endDate,
      numberOfWeeks,
      workingDays,
      dailyRate,
      basicSalary,
      medicalAllowance,
      transportationAllowance,
      overtime,
      bonus,
      grossSalary,
      deductions,
      totalDeductions,
      netSalary,
      wageType
    } = req.body;

    // Check if record already exists
    const existingRecord = await SalaryRecord.findOne({
      staffMember: staffId,
      month,
      year
    });

    if (existingRecord) {
      return res.status(400).json({ 
        message: 'Salary record already exists for this period',
        record: existingRecord
      });
    }

    // Get staff details
    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Create period string
    const periodString = wageType === 'Weekly' 
      ? `${numberOfWeeks} week(s) (${startDate} to ${endDate})`
      : `${month}/${year}`;

    // Get month name for notification
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[month - 1];

    // Create salary record
    const salaryRecord = new SalaryRecord({
      staffMember: staffId,
      month,
      year,
      period: periodString,
      totalDays: workingDays,
      presentDays: workingDays,
      absentDays: 0,
      leaveDays: 0,
      basicSalary,
      medicalAllowance: medicalAllowance || 0,
      transportationAllowance: transportationAllowance || 0,
      overtime: overtime || 0,
      bonus: bonus || 0,
      grossSalary,
      deductions: {
        tax: deductions.tax || 0,
        providentFund: deductions.providentFund || 0,
        professionalTax: deductions.professionalTax || 0,
        other: deductions.other || 0
      },
      totalDeductions,
      netSalary,
      status: 'pending',
      generatedBy: req.user._id
    });

    await salaryRecord.save();

    // Send notification to staff member
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: staffId,
        role: 'staff',
        title: 'Salary Generated',
        message: `Your salary for ${monthName} ${year} has been generated. Net Salary: ₹${netSalary.toFixed(2)}`,
        link: '/staff/my-salary',
        meta: {
          salaryRecordId: salaryRecord._id,
          month,
          year,
          netSalary,
          type: 'salary_generated'
        }
      });
    } catch (notifError) {
      console.error('Error sending salary notification:', notifError);
      // Don't fail the salary generation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Salary record generated successfully and notification sent to staff',
      data: salaryRecord
    });
  } catch (error) {
    console.error('Generate salary record error:', error);
    res.status(500).json({ message: 'Error generating salary record', error: error.message });
  }
};

// Get all salary records
exports.getAllSalaryRecords = async (req, res) => {
  try {
    const { month, year, status, staffId } = req.query;
    
    let query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);
    if (status) query.status = status;
    if (staffId) query.staffMember = staffId;

    const salaryRecords = await SalaryRecord.find(query)
      .populate('staffMember', 'name email phone role')
      .populate('generatedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('paidBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: salaryRecords.length,
      data: salaryRecords
    });
  } catch (error) {
    console.error('Get salary records error:', error);
    res.status(500).json({ message: 'Error fetching salary records', error: error.message });
  }
};

// Get salary history for a specific staff member
exports.getSalaryHistory = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { year } = req.query;
    
    let query = { staffMember: staffId };
    if (year) query.year = parseInt(year);

    const salaryRecords = await SalaryRecord.find(query)
      .populate('staffMember', 'name email phone role')
      .populate('generatedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('paidBy', 'name')
      .sort({ year: -1, month: -1 });

    res.json({
      success: true,
      count: salaryRecords.length,
      data: salaryRecords
    });
  } catch (error) {
    console.error('Get salary history error:', error);
    res.status(500).json({ message: 'Error fetching salary history', error: error.message });
  }
};

// Get salary record by ID
exports.getSalaryRecordById = async (req, res) => {
  try {
    const salaryRecord = await SalaryRecord.findById(req.params.id)
      .populate('staffMember', 'name email phone role dailyWage')
      .populate('generatedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('paidBy', 'name');

    if (!salaryRecord) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    res.json({
      success: true,
      data: salaryRecord
    });
  } catch (error) {
    console.error('Get salary record error:', error);
    res.status(500).json({ message: 'Error fetching salary record', error: error.message });
  }
};

// Update salary record
exports.updateSalaryRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const salaryRecord = await SalaryRecord.findById(id);
    if (!salaryRecord) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        salaryRecord[key] = updates[key];
      }
    });

    // Recalculate if salary components changed
    if (updates.basicSalary || updates.allowances || updates.overtime || updates.bonus) {
      salaryRecord.grossSalary = 
        (salaryRecord.basicSalary || 0) + 
        (salaryRecord.allowances || 0) + 
        (salaryRecord.overtime || 0) + 
        (salaryRecord.bonus || 0);
    }

    if (updates.deductions) {
      salaryRecord.totalDeductions = 
        (salaryRecord.deductions.tax || 0) +
        (salaryRecord.deductions.providentFund || 0) +
        (salaryRecord.deductions.insurance || 0) +
        (salaryRecord.deductions.loanDeduction || 0) +
        (salaryRecord.deductions.other || 0);
    }

    salaryRecord.netSalary = salaryRecord.grossSalary - salaryRecord.totalDeductions;

    await salaryRecord.save();

    res.json({
      success: true,
      message: 'Salary record updated successfully',
      data: salaryRecord
    });
  } catch (error) {
    console.error('Update salary record error:', error);
    res.status(500).json({ message: 'Error updating salary record', error: error.message });
  }
};

// Approve salary record
exports.approveSalaryRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const salaryRecord = await SalaryRecord.findById(id);
    if (!salaryRecord) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    salaryRecord.status = 'approved';
    salaryRecord.approvedBy = req.user._id;
    await salaryRecord.save();

    res.json({
      success: true,
      message: 'Salary record approved successfully',
      data: salaryRecord
    });
  } catch (error) {
    console.error('Approve salary record error:', error);
    res.status(500).json({ message: 'Error approving salary record', error: error.message });
  }
};

// Mark salary as paid
exports.markAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, transactionId, paymentDate, remarks } = req.body;

    const salaryRecord = await SalaryRecord.findById(id);
    if (!salaryRecord) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    salaryRecord.status = 'paid';
    salaryRecord.paymentMethod = paymentMethod;
    salaryRecord.transactionId = transactionId;
    salaryRecord.paymentDate = paymentDate || new Date();
    salaryRecord.remarks = remarks;
    salaryRecord.paidBy = req.user._id;
    
    await salaryRecord.save();

    res.json({
      success: true,
      message: 'Salary marked as paid successfully',
      data: salaryRecord
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({ message: 'Error marking salary as paid', error: error.message });
  }
};

// Get my salary (for staff members)
exports.getMySalary = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get salary records
    const salaryRecords = await SalaryRecord.find({ 
      staffMember: userId
    })
    .sort({ year: -1, month: -1 })
    .limit(12);

    // Get user's daily salary rate from User model
    const user = await User.findById(userId).select('dailySalary baseSalary role dailyWage');
    let dailyRate = user.dailySalary || user.baseSalary || user.dailyWage || 0;

    // If no rate found in User, check Worker model
    if (!dailyRate || dailyRate === 0) {
      const Worker = require('../models/workerModel');
      const worker = await Worker.findOne({ user: userId });
      if (worker) {
        dailyRate = worker.dailyWage || worker.monthlySalary || 0;
      }
    }

    // Default to 500 if still no rate found
    if (!dailyRate || dailyRate === 0) {
      dailyRate = 500;
    }

    res.json({
      success: true,
      count: salaryRecords.length,
      dailyRate,
      data: salaryRecords
    });
  } catch (error) {
    console.error('Get my salary error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching salary records', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Delete salary record
exports.deleteSalaryRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const salaryRecord = await SalaryRecord.findById(id);
    if (!salaryRecord) {
      return res.status(404).json({ message: 'Salary record not found' });
    }

    if (salaryRecord.status === 'paid') {
      return res.status(400).json({ message: 'Cannot delete paid salary records' });
    }

    await salaryRecord.deleteOne();

    res.json({
      success: true,
      message: 'Salary record deleted successfully'
    });
  } catch (error) {
    console.error('Delete salary record error:', error);
    res.status(500).json({ message: 'Error deleting salary record', error: error.message });
  }
};

// Get salary statistics
exports.getSalaryStatistics = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let query = {};
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const stats = await SalaryRecord.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalGross: { $sum: '$grossSalary' },
          totalNet: { $sum: '$netSalary' },
          totalDeductions: { $sum: '$totalDeductions' }
        }
      }
    ]);

    const totalRecords = await SalaryRecord.countDocuments(query);

    res.json({
      success: true,
      data: {
        totalRecords,
        byStatus: stats
      }
    });
  } catch (error) {
    console.error('Get salary statistics error:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
};

// Mark payslip as sent to staff
exports.markPayslipAsSent = async (req, res) => {
  try {
    const { staffId, month, year } = req.body;

    // Find the salary record
    const salaryRecord = await SalaryRecord.findOne({
      staffMember: staffId,
      month,
      year
    });

    if (!salaryRecord) {
      return res.status(404).json({ 
        success: false,
        message: 'Salary record not found' 
      });
    }

    // Update payslip sent status
    salaryRecord.payslipSent = true;
    salaryRecord.payslipSentAt = new Date();
    salaryRecord.payslipSentBy = req.user._id;
    
    await salaryRecord.save();

    res.json({
      success: true,
      message: 'Payslip marked as sent successfully',
      data: salaryRecord
    });
  } catch (error) {
    console.error('Mark payslip as sent error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error marking payslip as sent', 
      error: error.message 
    });
  }
};
