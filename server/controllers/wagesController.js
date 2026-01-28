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
