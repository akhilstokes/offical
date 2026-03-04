const Attendance = require('../models/attendanceModel');
const User = require('../models/userModel');
const ActivityLogger = require('../services/activityLogger');
const Shift = require('../models/shiftModel');
const mongoose = require('mongoose');

// Helper function to resolve staff ObjectId
async function resolveStaffObjectId(authUser) {
  try {
    // Handle built-in tokens that have string IDs
    if (typeof authUser._id === 'string' && authUser._id.startsWith('builtin_')) {
      return null;
    }

    // If it's already an ObjectId, return it
    if (mongoose.Types.ObjectId.isValid(authUser._id)) {
      return authUser._id;
    }

    // Try to find user by staffId or email
    const user = await User.findOne({
      $or: [
        { staffId: authUser.staffId },
        { email: authUser.email },
        { _id: authUser._id }
      ]
    }).select('_id');

    return user ? user._id : null;
  } catch (error) {
    console.error('Error resolving staff ObjectId:', error);
    return null;
  }
}

const attendanceController = {
  async getAttendance(req, res) {
    try {
      const { staffId, date, status } = req.query;
      const query = {};
      
      if (staffId) query.staff = staffId;
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        query.date = { $gte: startDate, $lt: endDate };
      }
      if (status) query.status = status;

      const attendance = await Attendance.find(query)
        .populate('staff', 'name email staffId')
        .sort({ date: -1 });
      
      res.json({ success: true, data: attendance });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ message: 'Failed to fetch attendance' });
    }
  },

  async getAttendanceById(req, res) {
    try {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: 'Invalid attendance ID format' });
      }

      const attendance = await Attendance.findById(req.params.id)
        .populate('staff', 'name email staffId');
      
      if (!attendance) {
        return res.status(404).json({ message: 'Attendance record not found' });
      }
      
      res.json({ success: true, data: attendance });
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ message: 'Failed to fetch attendance' });
    }
  },

  async createAttendance(req, res) {
    try {
      const { staff, date, status, checkInAt, checkOutAt } = req.body;
      
      const attendance = new Attendance({
        staff,
        date,
        status,
        checkInAt,
        checkOutAt
      });
      
      await attendance.save();
      
      const populatedAttendance = await Attendance.findById(attendance._id)
        .populate('staff', 'name email staffId');
      
      res.status(201).json({ success: true, data: populatedAttendance });
    } catch (error) {
      console.error('Error creating attendance:', error);
      res.status(500).json({ message: 'Failed to create attendance' });
    }
  },

  async updateAttendance(req, res) {
    try {
      const { id } = req.params;
      
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid attendance ID format' });
      }

      const updates = req.body;
      
      const attendance = await Attendance.findByIdAndUpdate(id, updates, { new: true })
        .populate('staff', 'name email staffId');
      
      if (!attendance) {
        return res.status(404).json({ message: 'Attendance record not found' });
      }
      
      res.json({ success: true, data: attendance });
    } catch (error) {
      console.error('Error updating attendance:', error);
      res.status(500).json({ message: 'Failed to update attendance' });
    }
  },

  // Get user's shift information
  async getUserShift(req, res) {
    try {
      const staffId = await resolveStaffObjectId(req.user);
      if (!staffId) {
        return res.status(400).json({ message: 'Invalid user authentication' });
      }

      const shift = await Shift.findOne({ assignedStaff: staffId, isActive: true })
        .populate('assignedStaff', 'name email staffId');

      res.status(200).json({
        success: true,
        shift: shift || null
      });
    } catch (error) {
      console.error('Error fetching user shift:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  },

  // Admin/Manager/Accountant: mark attendance for a specific staff member
  async adminMarkAttendance(req, res) {
    try {
      const { staffId: rawStaffId, type, location, notes, timestamp } = req.body || {};

      if (!rawStaffId || !type) {
        return res.status(400).json({ message: 'Staff ID and type are required' });
      }

      if (!['check_in', 'check_out'].includes(type)) {
        return res.status(400).json({ message: 'Type must be check_in or check_out' });
      }

      const staffId = await resolveStaffObjectId({ _id: rawStaffId });
      if (!staffId) {
        return res.status(400).json({ message: 'Invalid staff ID' });
      }

      const attendanceTimestamp = timestamp ? new Date(timestamp) : new Date();
      const today = new Date(attendanceTimestamp);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let attendance = await Attendance.findOne({
        staff: staffId,
        date: { $gte: today, $lt: tomorrow }
      });

      if (!attendance) {
        if (type === 'check_out') {
          return res.status(400).json({ message: 'Cannot check out without checking in first' });
        }
        attendance = new Attendance({
          staff: staffId,
          date: today,
          checkInAt: attendanceTimestamp,
          location: location || 'Office',
          notes: notes || '',
          status: 'present',
          markedBy: req.user._id
        });
      } else {
        if (type === 'check_in') {
          if (attendance.checkInAt) {
            return res.status(400).json({ message: 'Already checked in today' });
          }
          attendance.checkInAt = attendanceTimestamp;
          attendance.status = 'present';
        } else {
          if (!attendance.checkInAt) {
            return res.status(400).json({ message: 'Cannot check out without checking in first' });
          }
          if (attendance.checkOutAt) {
            return res.status(400).json({ message: 'Already checked out today' });
          }
          attendance.checkOutAt = attendanceTimestamp;
        }
        attendance.location = location || attendance.location;
        attendance.notes = notes || attendance.notes;
        attendance.markedBy = req.user._id;
      }

      await attendance.save();
      await ActivityLogger.log(req.user._id, 'attendance', 'admin_mark', {
        targetStaff: staffId,
        type: type,
        timestamp: attendanceTimestamp
      });

      const populatedAttendance = await Attendance.findById(attendance._id)
        .populate('staff', 'name email staffId')
        .populate('markedBy', 'name email');

      res.status(200).json({
        success: true,
        message: `Successfully marked ${type.replace('_', ' ')} for staff member`,
        attendance: populatedAttendance
      });
    } catch (error) {
      console.error('Admin mark attendance error:', error);
      return res.status(500).json({ message: 'Server Error', error: error.message });
    }
  },

  // Get today's attendance for user
  async getTodayAttendance(req, res) {
    try {
      const staffId = await resolveStaffObjectId(req.user);
      if (!staffId) {
        return res.status(400).json({ message: 'Invalid user authentication' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const attendance = await Attendance.findOne({
        staff: staffId,
        date: { $gte: today, $lt: tomorrow }
      }).populate('staff', 'name email staffId');

      res.status(200).json({
        success: true,
        attendance: attendance || null
      });
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  },

  // Mark attendance (check in/out)
  async markAttendance(req, res) {
    try {
      const { type, location, notes, timestamp } = req.body;

      if (!type || !['check_in', 'check_out'].includes(type)) {
        return res.status(400).json({ message: 'Valid type (check_in or check_out) is required' });
      }

      const staffId = await resolveStaffObjectId(req.user);
      if (!staffId) {
        return res.status(400).json({ message: 'Invalid user authentication' });
      }

      const attendanceTimestamp = timestamp ? new Date(timestamp) : new Date();
      const today = new Date(attendanceTimestamp);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let attendance = await Attendance.findOne({
        staff: staffId,
        date: { $gte: today, $lt: tomorrow }
      });

      if (!attendance) {
        if (type === 'check_out') {
          return res.status(400).json({ message: 'Cannot check out without checking in first' });
        }
        attendance = new Attendance({
          staff: staffId,
          date: today,
          checkInAt: attendanceTimestamp,
          location: location || 'Office',
          notes: notes || '',
          status: 'present'
        });
      } else {
        if (type === 'check_in') {
          if (attendance.checkInAt) {
            return res.status(400).json({ message: 'Already checked in today' });
          }
          attendance.checkInAt = attendanceTimestamp;
          attendance.status = 'present';
        } else {
          if (!attendance.checkInAt) {
            return res.status(400).json({ message: 'Cannot check out without checking in first' });
          }
          if (attendance.checkOutAt) {
            return res.status(400).json({ message: 'Already checked out today' });
          }
          attendance.checkOutAt = attendanceTimestamp;
        }
        attendance.location = location || attendance.location;
        attendance.notes = notes || attendance.notes;
      }

      await attendance.save();
      await ActivityLogger.log(req.user._id, 'attendance', type, {
        timestamp: attendanceTimestamp,
        location: location
      });

      const populatedAttendance = await Attendance.findById(attendance._id)
        .populate('staff', 'name email staffId');

      res.status(200).json({
        success: true,
        message: `Successfully ${type.replace('_', ' ')}`,
        attendance: populatedAttendance
      });
    } catch (error) {
      console.error('Mark attendance error:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  },

  // Get attendance history for user
  async getAttendanceHistory(req, res) {
    try {
      const staffId = await resolveStaffObjectId(req.user);
      if (!staffId) {
        return res.status(400).json({ message: 'Invalid user authentication' });
      }

      const { page = 1, limit = 10, fromDate, toDate } = req.query;
      const query = { staff: staffId };

      if (fromDate || toDate) {
        query.date = {};
        if (fromDate) query.date.$gte = new Date(fromDate);
        if (toDate) {
          const endDate = new Date(toDate);
          endDate.setHours(23, 59, 59, 999);
          query.date.$lte = endDate;
        }
      }

      const attendance = await Attendance.find(query)
        .populate('staff', 'name email staffId')
        .sort({ date: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Attendance.countDocuments(query);

      res.status(200).json({
        success: true,
        attendance,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  },

  // Get all attendance (for managers)
  async getAllAttendance(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        staffId, 
        fromDate, 
        toDate, 
        status,
        sortBy = 'date',
        sortOrder = 'desc'
      } = req.query;

      const query = {};
      
      if (staffId) {
        const resolvedStaffId = await resolveStaffObjectId({ _id: staffId });
        if (resolvedStaffId) query.staff = resolvedStaffId;
      }
      
      if (fromDate || toDate) {
        query.date = {};
        if (fromDate) query.date.$gte = new Date(fromDate);
        if (toDate) {
          const endDate = new Date(toDate);
          endDate.setHours(23, 59, 59, 999);
          query.date.$lte = endDate;
        }
      }
      
      if (status) query.status = status;

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const attendance = await Attendance.find(query)
        .populate('staff', 'name email staffId')
        .populate('markedBy', 'name email')
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Attendance.countDocuments(query);

      res.status(200).json({
        success: true,
        attendance,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      console.error('Error fetching all attendance:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  },

  // Get today's attendance for all staff (for managers)
  async getTodayAttendanceAll(req, res) {
    try {
      const { date } = req.query;
      
      // Use provided date or default to today
      const targetDate = date ? new Date(date) : new Date();
      targetDate.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all staff members (excluding admin role)
      const allStaff = await User.find({ 
        role: { $ne: 'admin' }
      }).select('name email role staffId').lean();

      // Get attendance records for the date
      const attendanceRecords = await Attendance.find({
        date: {
          $gte: targetDate,
          $lte: endOfDay
        }
      })
      .populate('staff', 'name email role staffId')
      .populate('shift', 'name startTime endTime')
      .populate('markedBy', 'name email role')
      .lean();

      // Create a map of staff ID to attendance
      const attendanceMap = new Map();
      attendanceRecords.forEach(record => {
        if (record.staff && record.staff._id) {
          attendanceMap.set(record.staff._id.toString(), record);
        }
      });

      // Merge all staff with their attendance (or create absent records)
      const attendance = allStaff.map(staff => {
        const existingAttendance = attendanceMap.get(staff._id.toString());
        
        if (existingAttendance) {
          return existingAttendance;
        } else {
          // Create absent record for staff without attendance
          return {
            _id: null,
            staff: staff,
            date: targetDate,
            checkIn: null,
            checkOut: null,
            status: 'absent',
            location: null,
            notes: null,
            shift: null,
            isLate: false,
            lateMinutes: 0
          };
        }
      });

      // Sort by status (present first, then late, then absent) and then by checkIn time
      attendance.sort((a, b) => {
        const statusOrder = { present: 1, late: 2, absent: 3 };
        const aStatus = a.status || 'absent';
        const bStatus = b.status || 'absent';
        
        if (statusOrder[aStatus] !== statusOrder[bStatus]) {
          return statusOrder[aStatus] - statusOrder[bStatus];
        }
        
        // If same status, sort by checkIn time (most recent first)
        if (a.checkIn && b.checkIn) {
          return new Date(b.checkIn) - new Date(a.checkIn);
        }
        if (a.checkIn) return -1;
        if (b.checkIn) return 1;
        
        // If both absent, sort by name
        return (a.staff?.name || '').localeCompare(b.staff?.name || '');
      });

      res.status(200).json({
        success: true,
        attendance
      });
    } catch (error) {
      console.error('Error fetching today attendance for all:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  },

  // Approve attendance (for managers)
  async approveAttendance(req, res) {
    try {
      const { id } = req.params;
      
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.error('Invalid attendance ID:', id);
        return res.status(400).json({ message: 'Invalid attendance ID format', id });
      }

      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({ message: 'Status is required in request body' });
      }

      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Status must be approved or rejected' });
      }

      const attendance = await Attendance.findById(id);
      if (!attendance) {
        return res.status(404).json({ message: 'Attendance record not found' });
      }

      attendance.status = status;
      attendance.approvedBy = req.user._id;
      attendance.approvedAt = new Date();
      if (notes) attendance.approvalNotes = notes;

      await attendance.save();
      
      // Try to log activity, but don't fail if it errors
      try {
        await ActivityLogger.log(req.user._id, 'attendance', 'approve', {
          attendanceId: id,
          status: status
        });
      } catch (logError) {
        console.warn('Failed to log activity:', logError.message);
      }

      const populatedAttendance = await Attendance.findById(id)
        .populate('staff', 'name email staffId')
        .populate('approvedBy', 'name email');

      res.status(200).json({
        success: true,
        message: `Attendance ${status} successfully`,
        attendance: populatedAttendance
      });
    } catch (error) {
      console.error('Error approving attendance:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  },

  // Get attendance analytics
  async getAttendanceAnalytics(req, res) {
    try {
      const { fromDate, toDate, staffId } = req.query;
      
      const matchStage = {};
      if (fromDate || toDate) {
        matchStage.date = {};
        if (fromDate) matchStage.date.$gte = new Date(fromDate);
        if (toDate) {
          const endDate = new Date(toDate);
          endDate.setHours(23, 59, 59, 999);
          matchStage.date.$lte = endDate;
        }
      }
      
      if (staffId) {
        const resolvedStaffId = await resolveStaffObjectId({ _id: staffId });
        if (resolvedStaffId) matchStage.staff = resolvedStaffId;
      }

      const analytics = await Attendance.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalDays: { $sum: 1 },
            presentDays: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
            absentDays: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
            lateDays: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
            avgCheckInTime: { $avg: { $hour: '$checkInAt' } },
            avgCheckOutTime: { $avg: { $hour: '$checkOutAt' } }
          }
        }
      ]);

      const result = analytics[0] || {
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        avgCheckInTime: 0,
        avgCheckOutTime: 0
      };

      res.status(200).json({
        success: true,
        analytics: result
      });
    } catch (error) {
      console.error('Error fetching attendance analytics:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  },

  // Get weekly attendance summary
  async getWeeklySummary(req, res) {
    try {
      const today = new Date();
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const { staffId } = req.query;
      const matchStage = {
        date: { $gte: startOfWeek, $lte: endOfWeek }
      };

      if (staffId) {
        const resolvedStaffId = await resolveStaffObjectId({ _id: staffId });
        if (resolvedStaffId) matchStage.staff = resolvedStaffId;
      }

      const summary = await Attendance.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              staff: '$staff',
              dayOfWeek: { $dayOfWeek: '$date' }
            },
            status: { $first: '$status' },
            checkInAt: { $first: '$checkInAt' },
            checkOutAt: { $first: '$checkOutAt' }
          }
        },
        {
          $group: {
            _id: '$_id.staff',
            days: {
              $push: {
                dayOfWeek: '$_id.dayOfWeek',
                status: '$status',
                checkInAt: '$checkInAt',
                checkOutAt: '$checkOutAt'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'staff'
          }
        },
        {
          $unwind: '$staff'
        },
        {
          $project: {
            staff: {
              _id: '$staff._id',
              name: '$staff.name',
              email: '$staff.email',
              staffId: '$staff.staffId'
            },
            days: 1
          }
        }
      ]);

      res.status(200).json({
        success: true,
        weekStart: startOfWeek,
        weekEnd: endOfWeek,
        summary
      });
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  },

  // Verify attendance (for managers)
  async verifyAttendance(req, res) {
    try {
      const { id } = req.params;
      
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.error('Invalid attendance ID:', id);
        return res.status(400).json({ message: 'Invalid attendance ID format', id });
      }

      const { verified, notes } = req.body;

      const attendance = await Attendance.findById(id);
      if (!attendance) {
        return res.status(404).json({ message: 'Attendance record not found' });
      }

      attendance.verified = verified !== undefined ? verified : true;
      attendance.verifiedBy = req.user._id;
      attendance.verifiedAt = new Date();
      if (notes) attendance.verificationNotes = notes;

      await attendance.save();
      
      // Try to log activity, but don't fail if it errors
      try {
        await ActivityLogger.log(req.user._id, 'attendance', 'verify', {
          attendanceId: id,
          verified: attendance.verified
        });
      } catch (logError) {
        console.warn('Failed to log activity:', logError.message);
      }

      const populatedAttendance = await Attendance.findById(id)
        .populate('staff', 'name email staffId')
        .populate('verifiedBy', 'name email');

      res.status(200).json({
        success: true,
        message: `Attendance ${attendance.verified ? 'verified' : 'unverified'} successfully`,
        attendance: populatedAttendance
      });
    } catch (error) {
      console.error('Error verifying attendance:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  },

  // Delete attendance (for admins)
  async deleteAttendance(req, res) {
    try {
      const { id } = req.params;
      
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid attendance ID format' });
      }

      const attendance = await Attendance.findById(id);
      if (!attendance) {
        return res.status(404).json({ message: 'Attendance record not found' });
      }

      await Attendance.findByIdAndDelete(id);
      await ActivityLogger.log(req.user._id, 'attendance', 'delete', {
        attendanceId: id,
        staffId: attendance.staff
      });

      res.status(200).json({
        success: true,
        message: 'Attendance record deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting attendance:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  },

  // Get staff attendance (for managers)
  async getStaffAttendance(req, res) {
    try {
      const { staffId } = req.params;
      const { page = 1, limit = 20, fromDate, toDate, status } = req.query;

      const resolvedStaffId = await resolveStaffObjectId({ _id: staffId });
      if (!resolvedStaffId) {
        return res.status(400).json({ message: 'Invalid staff ID' });
      }

      const query = { staff: resolvedStaffId };
      
      if (fromDate || toDate) {
        query.date = {};
        if (fromDate) query.date.$gte = new Date(fromDate);
        if (toDate) {
          const endDate = new Date(toDate);
          endDate.setHours(23, 59, 59, 999);
          query.date.$lte = endDate;
        }
      }
      
      if (status) query.status = status;

      const attendance = await Attendance.find(query)
        .populate('staff', 'name email staffId')
        .populate('markedBy', 'name email')
        .sort({ date: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Attendance.countDocuments(query);

      res.status(200).json({
        success: true,
        attendance,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
    } catch (error) {
      console.error('Error fetching staff attendance:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  },

  // RFID attendance endpoint (no auth required - called by Arduino)
  async rfidAttendance(req, res) {
    try {
      console.log('RFID Request received:', req.body);
      
      const { uid, date, time } = req.body;

      if (!uid) {
        console.log('RFID Error: UID is missing');
        return res.status(400).json({ message: 'UID is required' });
      }

      // Find user by RFID UID (case-insensitive)
      const user = await User.findOne({ rfidUid: uid.toUpperCase() });
      if (!user) {
        console.log('RFID Error: User not found for UID:', uid);
        return res.status(404).json({ message: 'RFID card not registered', uid });
      }

      console.log('RFID User found:', user.name, user.staffId);

      // Parse date and time from Arduino
      let timestamp;
      if (date && time) {
        const [day, month, year] = date.split('-');
        const [hours, minutes, seconds] = time.split(':');
        timestamp = new Date(year, month - 1, day, hours, minutes, seconds);
      } else {
        // If no date/time provided, use current time
        timestamp = new Date();
      }

      const today = new Date(timestamp);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Check if attendance record exists for today
      let attendance = await Attendance.findOne({
        staff: user._id,
        date: { $gte: today, $lt: tomorrow }
      });

      let action = '';
      if (!attendance) {
        // First scan - check in
        attendance = new Attendance({
          staff: user._id,
          date: today,
          checkIn: timestamp,
          status: 'present',
          location: 'RFID Scanner',
          notes: 'Auto-marked via RFID'
        });
        action = 'check_in';
        console.log('RFID: Creating new check-in record');
      } else if (!attendance.checkOut) {
        // Second scan - check out
        attendance.checkOut = timestamp;
        action = 'check_out';
        console.log('RFID: Updating with check-out');
      } else {
        // Already checked in and out
        console.log('RFID: Already checked in and out today');
        return res.status(400).json({ 
          message: 'Already checked in and out today',
          user: { name: user.name, staffId: user.staffId }
        });
      }

      await attendance.save();
      console.log('RFID: Attendance saved successfully');

      res.status(200).json({
        success: true,
        message: `${action === 'check_in' ? 'Check-in' : 'Check-out'} successful`,
        action,
        user: {
          name: user.name,
          staffId: user.staffId,
          email: user.email
        },
        attendance: {
          date: attendance.date,
          checkIn: attendance.checkIn,
          checkOut: attendance.checkOut,
          status: attendance.status
        }
      });
    } catch (error) {
      console.error('RFID attendance error:', error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  }
};

module.exports = attendanceController;