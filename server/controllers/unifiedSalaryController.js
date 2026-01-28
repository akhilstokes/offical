const User = require('../models/userModel');
const Salary = require('../models/salaryModel');
const SalaryTemplate = require('../models/salaryTemplateModel');
const Worker = require('../models/workerModel');
const SalarySummary = require('../models/salarySummaryModel');
const Attendance = require('../models/attendanceModel');

// Unified salary endpoint that determines payment type based on role
exports.getUnifiedSalary = async (req, res) => {
  try {
    const userId = req.user._id;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ message: 'Year and month are required' });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let salaryData = null;

    // Determine salary type based on role
    switch (user.role) {
      case 'delivery_staff':
      case 'field_staff':
        // Daily wage system
        salaryData = await getDailyWageData(userId, Number(year), Number(month));
        break;

      case 'lab':
      case 'lab_staff':
      case 'lab_manager':
        // Monthly salary system
        salaryData = await getMonthlySalaryData(userId, Number(year), Number(month));
        break;

      default:
        // Check if user has worker record (daily wage)
        const worker = await Worker.findOne({ user: userId });
        if (worker) {
          salaryData = await getDailyWageData(userId, Number(year), Number(month));
        } else {
          // Monthly salary system (default)
          salaryData = await getMonthlySalaryData(userId, Number(year), Number(month));
        }
        break;
    }

    res.json({
      data: {
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          salaryType: salaryData.salaryType
        },
        salary: salaryData.salary,
        history: salaryData.history || []
      }
    });

  } catch (error) {
    console.error('Error fetching unified salary:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get daily wage data for daily wage workers
async function getDailyWageData(userId, year, month) {
  try {
    // Get worker record
    const worker = await Worker.findOne({ user: userId });
    if (!worker) {
      throw new Error('Worker record not found');
    }

    // Calculate attendance for the month
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0);
    to.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      staff: userId,
      date: { $gte: from, $lte: to },
      checkInAt: { $ne: null }
    });

    const workingDays = attendance.length;
    const dailyWage = worker.dailyWage || 0;
    const grossSalary = workingDays * dailyWage;

    // Get salary summary
    let summary = await SalarySummary.findOne({
      staff: userId,
      year: year,
      month: month
    });

    if (!summary) {
      summary = await SalarySummary.create({
        staff: userId,
        year: year,
        month: month,
        workingDays: workingDays,
        dailyWage: dailyWage,
        grossSalary: grossSalary
      });
    }

    // Get payment history
    const history = await SalarySummary.find({ staff: userId })
      .sort({ year: -1, month: -1 })
      .limit(12);

    return {
      salaryType: 'daily',
      salary: {
        workingDays,
        dailyWage,
        grossSalary,
        receivedAmount: summary.receivedAmount || 0,
        advanceAmount: summary.advanceAmount || 0,
        bonusAmount: summary.bonusAmount || 0,
        deductionAmount: summary.deductionAmount || 0,
        pendingAmount: summary.pendingAmount || 0
      },
      history: history.map(h => ({
        year: h.year,
        month: h.month,
        workingDays: h.workingDays,
        grossSalary: h.grossSalary,
        receivedAmount: h.receivedAmount,
        advanceAmount: h.advanceAmount,
        pendingAmount: h.pendingAmount
      }))
    };

  } catch (error) {
    console.error('Error getting daily wage data:', error);
    throw error;
  }
}

// Get monthly salary data for monthly salary workers
async function getMonthlySalaryData(userId, year, month) {
  try {
    // Get salary record for the month
    let salary = await Salary.findOne({
      staffMember: userId,
      year: year,
      month: month
    }).populate('staffMember', 'name email role staffId');

    // If no salary record exists, check if template exists
    if (!salary) {
      const template = await SalaryTemplate.findOne({
        staff: userId,
        isActive: true
      });

      if (!template) {
        return {
          salaryType: 'monthly',
          salary: null,
          history: []
        };
      }

      // Create draft salary record
      const grossSalary = template.basicSalary +
                         template.houseRentAllowance +
                         template.medicalAllowance +
                         template.transportAllowance +
                         template.specialAllowance;

      salary = await Salary.create({
        staffMember: userId,
        year: year,
        month: month,
        basicSalary: template.basicSalary,
        houseRentAllowance: template.houseRentAllowance,
        medicalAllowance: template.medicalAllowance,
        transportAllowance: template.transportAllowance,
        specialAllowance: template.specialAllowance,
        grossSalary: grossSalary,
        status: 'draft'
      });
    }

    // Get salary history
    const history = await Salary.find({ staffMember: userId })
      .sort({ year: -1, month: -1 })
      .limit(12)
      .select('year month basicSalary grossSalary netSalary status');

    return {
      salaryType: 'monthly',
      salary: salary,
      history: history
    };

  } catch (error) {
    console.error('Error getting monthly salary data:', error);
    throw error;
  }
}

// Get unified salary history
exports.getUnifiedSalaryHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 12 } = req.query;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let history = [];

    // Get history based on role
    switch (user.role) {
      case 'delivery_staff':
      case 'field_staff':
        // Daily wage history
        const dailyHistory = await SalarySummary.find({ staff: userId })
          .sort({ year: -1, month: -1 })
          .limit(Number(limit));

        history = dailyHistory.map(h => ({
          year: h.year,
          month: h.month,
          type: 'daily',
          workingDays: h.workingDays,
          grossSalary: h.grossSalary,
          netSalary: h.grossSalary - (h.deductionAmount || 0) + (h.bonusAmount || 0),
          receivedAmount: h.receivedAmount,
          pendingAmount: h.pendingAmount,
          status: h.pendingAmount > 0 ? 'pending' : 'paid'
        }));
        break;

      case 'lab':
      case 'lab_staff':
      case 'lab_manager':
      default:
        // Monthly salary history
        const monthlyHistory = await Salary.find({ staffMember: userId })
          .sort({ year: -1, month: -1 })
          .limit(Number(limit))
          .select('year month basicSalary grossSalary netSalary status');

        history = monthlyHistory.map(s => ({
          year: s.year,
          month: s.month,
          type: 'monthly',
          basicSalary: s.basicSalary,
          grossSalary: s.grossSalary,
          netSalary: s.netSalary,
          status: s.status
        }));
        break;
    }

    res.json({ data: history });

  } catch (error) {
    console.error('Error fetching unified salary history:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
