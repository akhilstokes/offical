const User = require('../models/userModel');
const StaffSchedule = require('../models/staffScheduleModel');

// Bulk assign schedules to staff
exports.bulkAssignSchedule = async (req, res) => {
  try {
    const { schedules } = req.body;
    const managerId = req.user.id;

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Schedules array is required' 
      });
    }

    const results = [];
    const errors = [];

    for (const schedule of schedules) {
      try {
        const { staffId, date, shift } = schedule;

        // Validate staff exists
        const staff = await User.findById(staffId);
        if (!staff) {
          errors.push({ staffId, error: 'Staff not found' });
          continue;
        }

        // Check if schedule already exists for this date
        const existing = await StaffSchedule.findOne({
          staffId,
          date: new Date(date)
        });

        if (existing) {
          // Update existing schedule
          existing.shift = shift;
          existing.assignedBy = managerId;
          existing.updatedAt = new Date();
          await existing.save();
          results.push({ staffId, action: 'updated', schedule: existing });
        } else {
          // Create new schedule
          const newSchedule = new StaffSchedule({
            staffId,
            staffName: staff.name,
            staffRole: staff.role,
            date: new Date(date),
            shift,
            assignedBy: managerId,
            status: 'assigned'
          });
          await newSchedule.save();
          results.push({ staffId, action: 'created', schedule: newSchedule });
        }
      } catch (err) {
        errors.push({ staffId: schedule.staffId, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Successfully processed ${results.length} schedules`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error bulk assigning schedules:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to assign schedules' 
    });
  }
};

// Get schedules by date range
exports.getSchedulesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    }

    const schedules = await StaffSchedule.find(query)
      .populate('staffId', 'name email phoneNumber role')
      .populate('assignedBy', 'name')
      .sort({ date: 1, staffName: 1 });

    res.json({
      success: true,
      count: schedules.length,
      schedules
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch schedules' 
    });
  }
};

// Get schedule history with filters and validation
exports.getScheduleHistory = async (req, res) => {
  try {
    const { startDate, endDate, staffId, shift } = req.query;

    // Build query with validation
    const query = {};

    // Date range validation
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format'
        });
      }

      if (start > end) {
        return res.status(400).json({
          success: false,
          message: 'Start date must be before or equal to end date'
        });
      }

      query.date = {
        $gte: start,
        $lte: end
      };
    } else if (startDate) {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid start date format'
        });
      }
      query.date = { $gte: start };
    } else if (endDate) {
      const end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid end date format'
        });
      }
      query.date = { $lte: end };
    }

    // Staff filter validation
    if (staffId) {
      if (!staffId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid staff ID format'
        });
      }
      query.staffId = staffId;
    }

    // Shift filter validation
    if (shift) {
      const validShifts = ['morning', 'evening', 'full-day', 'night'];
      if (!validShifts.includes(shift)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid shift type. Must be one of: morning, evening, full-day, night'
        });
      }
      query.shift = shift;
    }

    // Fetch schedules with populated data
    const schedules = await StaffSchedule.find(query)
      .populate('staffId', 'name email phoneNumber role')
      .populate('assignedBy', 'name email')
      .sort({ date: -1, createdAt: -1 })
      .limit(500); // Limit to prevent excessive data

    // Format response
    const formattedSchedules = schedules.map(schedule => ({
      _id: schedule._id,
      staffName: schedule.staffName,
      staffRole: schedule.staffRole,
      date: schedule.date,
      shift: schedule.shift,
      status: schedule.status,
      assignedBy: schedule.assignedBy ? {
        name: schedule.assignedBy.name,
        email: schedule.assignedBy.email
      } : null,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
      notes: schedule.notes
    }));

    res.json({
      success: true,
      count: formattedSchedules.length,
      schedules: formattedSchedules,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        staffId: staffId || null,
        shift: shift || null
      }
    });
  } catch (error) {
    console.error('Error fetching schedule history:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch schedule history',
      error: error.message
    });
  }
};

// Get schedule for specific staff
exports.getStaffSchedule = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { startDate, endDate } = req.query;

    const query = { staffId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const schedules = await StaffSchedule.find(query)
      .populate('assignedBy', 'name')
      .sort({ date: 1 });

    res.json({
      success: true,
      count: schedules.length,
      schedules
    });
  } catch (error) {
    console.error('Error fetching staff schedule:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch staff schedule' 
    });
  }
};

// Delete schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await StaffSchedule.findByIdAndDelete(scheduleId);
    if (!schedule) {
      return res.status(404).json({ 
        success: false,
        message: 'Schedule not found' 
      });
    }

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete schedule' 
    });
  }
};
