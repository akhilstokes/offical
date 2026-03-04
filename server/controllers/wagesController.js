const Salary = require('../models/salaryModel');
const SalarySummary = require('../models/salarySummaryModel');
const User = require('../models/userModel');
const Worker = require('../models/workerModel');
const Notification = require('../models/Notification');

// Get staff by role for wages calculation
exports.getStaffByRole = async (req, res) => {
  try {
    const { role } = req.query;
    
    if (!role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Role parameter is required' 
      });
    }
    
    // Build query for active users with the specified role
    const query = {
      role: role,
      status: { $ne: 'deleted' }
    };
    
    const staff = await User.find(query)
      .select('_id name email role staffId status')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: staff,
      total: staff.length
    });
  } catch (error) {
    console.error('Error fetching staff by role:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch staff', 
      error: error.message 
    });
  }
};

// Get payslips for users
exports.getPayslips = async (req, res) => {
  try {
    const { userId, group, role } = req.query;
    const userRole = req.user.role;
    
    let query = {};
    
    // Build query based on parameters
    if (userId) {
      query.staffMember = userId;
    } else if (group) {
      // Filter by group (delivery, field, lab, etc.)
      const users = await User.find({ role: { $regex: group, $options: 'i' } });
      query.staffMember = { $in: users.map(u => u._id) };
    } else if (role) {
      // Filter by role
      const users = await User.find({ role });
      query.staffMember = { $in: users.map(u => u._id) };
    }
    
    // If not admin/manager, only show own payslips
    if (!['admin', 'manager'].includes(userRole)) {
      query.staffMember = req.user._id;
    }
    
    const payslips = await Salary.find(query)
      .populate('staffMember', 'name email role staffId')
      .sort({ year: -1, month: -1, createdAt: -1 })
      .limit(100);
    
    res.json({
      success: true,
      data: payslips,
      total: payslips.length
    });
  } catch (error) {
    console.error('Error fetching payslips:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payslips', 
      error: error.message 
    });
  }
};

// Create payslip
exports.createPayslip = async (req, res) => {
  try {
    const { staffId, year, month, grossSalary, deductions, netSalary, notes } = req.body;
    
    if (!staffId || !year || !month || !grossSalary) {
      return res.status(400).json({ 
        success: false, 
        message: 'staffId, year, month, and grossSalary are required' 
      });
    }
    
    // Check if payslip already exists
    const existing = await Salary.findOne({
      staffMember: staffId,
      year: Number(year),
      month: Number(month)
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payslip already exists for this period' 
      });
    }
    
    const payslip = await Salary.create({
      staffMember: staffId,
      year: Number(year),
      month: Number(month),
      grossSalary: Number(grossSalary),
      deductions: Number(deductions) || 0,
      netSalary: Number(netSalary) || (Number(grossSalary) - (Number(deductions) || 0)),
      notes: notes || '',
      status: 'pending',
      createdBy: req.user._id
    });
    
    await payslip.populate('staffMember', 'name email role staffId');
    
    // Send notification to staff member about new payslip
    try {
      await Notification.create({
        userId: payslip.staffMember._id,
        role: payslip.staffMember.role,
        title: 'New Payslip Available',
        message: `Your payslip for ${payslip.month}/${payslip.year} has been created. Gross: ₹${payslip.grossSalary}, Net: ₹${payslip.netSalary}`,
        link: '/staff/salary',
        meta: { 
          salaryId: payslip._id, 
          year: payslip.year, 
          month: payslip.month,
          amount: payslip.netSalary
        }
      });
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Don't fail the request if notification fails
    }
    
    res.status(201).json({
      success: true,
      data: payslip,
      message: 'Payslip created successfully'
    });
  } catch (error) {
    console.error('Error creating payslip:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create payslip', 
      error: error.message 
    });
  }
};

// Update payslip
exports.updatePayslip = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const payslip = await Salary.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    ).populate('staffMember', 'name email role staffId');
    
    if (!payslip) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payslip not found' 
      });
    }
    
    // Send notification if status changed to approved or paid
    if (updates.status === 'approved' || updates.status === 'paid') {
      try {
        const statusMessage = updates.status === 'approved' ? 'approved' : 'paid';
        await Notification.create({
          userId: payslip.staffMember._id,
          role: payslip.staffMember.role,
          title: `Salary ${statusMessage.charAt(0).toUpperCase() + statusMessage.slice(1)}`,
          message: `Your salary for ${payslip.month}/${payslip.year} has been ${statusMessage}. Amount: ₹${payslip.netSalary || payslip.grossSalary}`,
          link: '/staff/salary',
          meta: { 
            salaryId: payslip._id, 
            year: payslip.year, 
            month: payslip.month,
            amount: payslip.netSalary || payslip.grossSalary,
            status: updates.status
          }
        });
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }
    
    res.json({
      success: true,
      data: payslip,
      message: 'Payslip updated successfully'
    });
  } catch (error) {
    console.error('Error updating payslip:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update payslip', 
      error: error.message 
    });
  }
};

// Delete payslip
exports.deletePayslip = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payslip = await Salary.findByIdAndDelete(id);
    
    if (!payslip) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payslip not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Payslip deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payslip:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete payslip', 
      error: error.message 
    });
  }
};

// Get all wage entries
exports.getAllWages = async (req, res) => {
  try {
    const wages = await SalarySummary.find()
      .populate('staff', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);
    
    // Transform to include staffName for frontend
    const wagesWithNames = wages.map(wage => ({
      ...wage.toObject(),
      staffId: wage.staff?._id,
      staffName: wage.staff?.name,
      staffRole: wage.staff?.role,
      date: wage.createdAt,
      dailyRate: wage.dailyWage || wage.grossSalary || 0
    }));
    
    res.json(wagesWithNames);
  } catch (error) {
    console.error('Error fetching wages:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch wages', 
      error: error.message 
    });
  }
};

// Create wage entry
exports.createWage = async (req, res) => {
  try {
    const { staffId, dailyRate, date } = req.body;
    
    if (!staffId || !dailyRate) {
      return res.status(400).json({ 
        success: false, 
        message: 'staffId and dailyRate are required' 
      });
    }
    
    // Get staff member details
    const staffMember = await User.findById(staffId);
    if (!staffMember) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff member not found' 
      });
    }
    
    // Parse the date or use current date
    const wageDate = date ? new Date(date) : new Date();
    const year = wageDate.getFullYear();
    const month = wageDate.getMonth() + 1;
    
    // Check if wage entry already exists for this staff/year/month
    const existing = await SalarySummary.findOne({
      staff: staffId,
      year: year,
      month: month
    });
    
    let wage;
    if (existing) {
      // Update existing entry by adding to the daily wage
      existing.dailyWage = (existing.dailyWage || 0) + Number(dailyRate);
      existing.workingDays = (existing.workingDays || 0) + 1;
      existing.baseSalary = existing.dailyWage;
      existing.grossSalary = existing.dailyWage;
      existing.netSalary = existing.dailyWage;
      existing.status = 'calculated';
      existing.calculatedAt = new Date();
      
      wage = await existing.save();
      await wage.populate('staff', 'name email role');
    } else {
      // Create new wage entry
      wage = await SalarySummary.create({
        staff: staffId,
        year: year,
        month: month,
        dailyWage: Number(dailyRate),
        baseSalary: Number(dailyRate),
        grossSalary: Number(dailyRate),
        netSalary: Number(dailyRate),
        workingDays: 1,
        wageType: 'daily',
        status: 'calculated',
        calculatedAt: new Date()
      });
      
      await wage.populate('staff', 'name email role');
    }
    
    // Also update or create Salary record for Staff/Accountant pages
    try {
      const existingSalary = await Salary.findOne({
        staffMember: staffId,
        year: year,
        month: month
      });
      
      if (existingSalary) {
        // Update existing salary record
        existingSalary.basicSalary = wage.grossSalary;
        existingSalary.grossSalary = wage.grossSalary;
        existingSalary.netSalary = wage.netSalary;
        existingSalary.presentDays = wage.workingDays;
        await existingSalary.save();
      } else {
        // Create new salary record
        await Salary.create({
          staffMember: staffId,
          year: year,
          month: month,
          period: `${year}-${String(month).padStart(2, '0')}`,
          basicSalary: wage.grossSalary,
          grossSalary: wage.grossSalary,
          netSalary: wage.netSalary,
          presentDays: wage.workingDays,
          totalDays: 30,
          status: 'pending'
        });
      }
    } catch (salaryError) {
      console.error('Error syncing to Salary model:', salaryError);
      // Don't fail the request if salary sync fails
    }
    
    res.status(201).json({
      ...wage.toObject(),
      staffId: wage.staff._id,
      staffName: wage.staff.name,
      staffRole: wage.staff.role,
      date: wage.createdAt,
      dailyRate: wage.dailyWage
    });
  } catch (error) {
    console.error('Error creating wage:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create wage entry', 
      error: error.message 
    });
  }
};
