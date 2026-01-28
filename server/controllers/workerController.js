const Worker = require('../models/workerModel');
const BarrelEntry = require('../models/barrelEntryModel');
const TripLog = require('../models/tripLogModel');
const RouteTask = require('../models/routeTaskModel');
const Attendance = require('../models/attendanceModel');
const SalarySummary = require('../models/salarySummaryModel');
const PayrollEntry = require('../models/payrollEntryModel');

// Return the worker document linked to the authenticated user
exports.getSelfWorker = async (req, res) => {
  try {
    const staffUserId = req.user._id;
    let worker = await Worker.findOne({ user: staffUserId }).populate('user', 'name email role');
    
    // If no worker profile exists, create one with basic info from user
    if (!worker) {
      worker = await Worker.create({
        user: staffUserId,
        name: req.user.name || '',
        createdBy: staffUserId
      });
      // Populate the user field after creation
      worker = await Worker.findById(worker._id).populate('user', 'name email role');
    }
    
    res.json(worker);
  } catch (e) {
    console.error('Error in getSelfWorker:', e);
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Lab: simplified check-in (no GPS required) with lab schedule validation
exports.checkInLab = async (req, res) => {
  try {
    const staffId = req.user._id;
    const today = new Date(); today.setHours(0,0,0,0);
    const existing = await Attendance.findOne({ staff: staffId, date: today });
    if (existing && existing.checkInAt) return res.status(400).json({ message: 'Already checked in' });
    const now = new Date();

    // Validate against Lab schedule
    let sched = await getWeekScheduleForDate(today, 'lab');
    // Fallback: if no lab schedule exists, allow a default 9:00-17:00 window for lab staff
    let assignment = null;
    if (!sched) {
      sched = {
        morningStart: '09:00',
        morningEnd: '17:00',
        eveningStart: '17:00',
        eveningEnd: '17:00',
        assignments: []
      };
      assignment = { shiftType: 'Morning', staff: staffId };
    } else {
      assignment = (sched.assignments || []).find(a => String(a.staff) === String(staffId));
      if (!assignment) {
        // If schedule exists but no explicit assignment for this staff, allow default Morning 9-5
        assignment = { shiftType: 'Morning', staff: staffId };
        if (!sched.morningStart) sched.morningStart = '09:00';
        if (!sched.morningEnd) sched.morningEnd = '17:00';
      }
    }

    const shiftStart = parseHHMMToDate(today, assignment.shiftType === 'Morning' ? (sched.morningStart || '09:00') : (sched.eveningStart || '17:00'));
    // Strict Lab window: from shiftStart to shiftStart + 5 minutes
    const checkInWindowStart = shiftStart;
    const checkInWindowEnd = new Date(shiftStart.getTime() + 5 * 60 * 1000);
    if (now < checkInWindowStart) {
      const timeStr = shiftStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return res.status(400).json({ message: `Check-in opens at ${timeStr}.` });
    }
    if (now > checkInWindowEnd) {
      const endStr = checkInWindowEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return res.status(400).json({ message: `Check-in window closed at ${endStr}.` });
    }

    // Late if after the scheduled start time
    let lateThreshold = shiftStart;
    const rec = existing || new Attendance({ staff: staffId, date: today });
    rec.checkInAt = now;
    rec.isLate = now.getTime() > lateThreshold.getTime();
    await rec.save();
    res.json(rec);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Lab: simplified check-out (no GPS required)
exports.checkOutLab = async (req, res) => {
  try {
    const staffId = req.user._id;
    const today = new Date(); today.setHours(0,0,0,0);
    const rec = await Attendance.findOne({ staff: staffId, date: today });
    if (!rec || !rec.checkInAt) return res.status(400).json({ message: 'Check-in required' });
    if (rec.checkOutAt) return res.status(400).json({ message: 'Already checked out' });
    const now = new Date();

    // Determine lab shift end time from weekly schedule or default 17:00
    let sched = await getWeekScheduleForDate(today, 'lab');
    let endHHMM = '17:00';
    if (sched && sched.morningEnd) endHHMM = sched.morningEnd;
    const shiftEnd = parseHHMMToDate(today, endHHMM || '17:00');
    const windowStart = shiftEnd;
    const windowEnd = new Date(shiftEnd.getTime() + 5 * 60 * 1000);
    if (now < windowStart) {
      const s = windowStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return res.status(400).json({ message: `Check-out opens at ${s}.` });
    }
    if (now > windowEnd) {
      const e = windowEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return res.status(400).json({ message: `Check-out window closed at ${e}.` });
    }

    rec.checkOutAt = now;
    await rec.save();
    res.json(rec);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Get lab staff's assigned shift schedule for current week
exports.getMyLabShiftSchedule = async (req, res) => {
  try {
    const staffId = req.user._id;
    const today = new Date();
    let sched = await getWeekScheduleForDate(today, 'lab');
    let myAssignment = null;
    if (!sched) {
      // Default 9–5 schedule for lab staff when no weekly schedule exists
      const weekStart = new Date(today); weekStart.setHours(0,0,0,0); const day = weekStart.getDay(); weekStart.setDate(weekStart.getDate()-day);
      sched = {
        weekStart,
        morningStart: '09:00',
        morningEnd: '17:00',
        eveningStart: '17:00',
        eveningEnd: '17:00',
        assignments: []
      };
      myAssignment = { shiftType: 'Morning' };
    } else {
      myAssignment = (sched.assignments || []).find(a => String(a.staff) === String(staffId));
      if (!myAssignment) {
        // Default to Morning 9–5 if not explicitly assigned
        myAssignment = { shiftType: 'Morning' };
        if (!sched.morningStart) sched.morningStart = '09:00';
        if (!sched.morningEnd) sched.morningEnd = '17:00';
      }
    }

    const response = {
      weekStart: sched.weekStart,
      morningStart: sched.morningStart || '09:00',
      morningEnd: sched.morningEnd || '17:00',
      eveningStart: sched.eveningStart || '17:00',
      eveningEnd: sched.eveningEnd || '17:00',
      myAssignment: myAssignment ? {
        shiftType: myAssignment.shiftType,
        startTime: myAssignment.shiftType === 'Morning' ? (sched.morningStart || '09:00') : (sched.eveningStart || '17:00'),
        endTime: myAssignment.shiftType === 'Morning' ? (sched.morningEnd || '17:00') : (sched.eveningEnd || '17:00')
      } : null
    };
    res.json(response);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Get field staff's assigned shift schedule for current week
// Get field staff's assigned shift schedule for current week
exports.getMyShiftSchedule = async (req, res) => {
  try {
    const StaffSchedule = require('../models/staffScheduleModel');
    const staffId = req.user._id;
    
    // Get current week's date range
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    endOfWeek.setHours(23, 59, 59, 999);

    // Fetch schedules for this week from StaffSchedule collection
    const schedules = await StaffSchedule.find({
      staffId: staffId,
      date: {
        $gte: startOfWeek,
        $lte: endOfWeek
      }
    }).sort({ date: 1 });

    if (!schedules || schedules.length === 0) {
      return res.json({ 
        message: 'No schedule assigned for this week', 
        shift: null,
        startTime: null,
        endTime: null,
        workingDays: []
      });
    }

    // Group schedules by shift type and get working days
    const workingDays = [];
    const shiftTypes = {};
    
    schedules.forEach(schedule => {
      const dayName = new Date(schedule.date).toLocaleDateString('en-US', { weekday: 'long' });
      workingDays.push(dayName);
      shiftTypes[schedule.shift] = (shiftTypes[schedule.shift] || 0) + 1;
    });

    // Determine primary shift (most common)
    const primaryShift = Object.keys(shiftTypes).reduce((a, b) => 
      shiftTypes[a] > shiftTypes[b] ? a : b
    );

    // Set shift times based on shift type
    let startTime, endTime;
    if (primaryShift === 'morning') {
      startTime = '06:00';
      endTime = '14:00';
    } else if (primaryShift === 'evening') {
      startTime = '14:00';
      endTime = '22:00';
    } else {
      startTime = '22:00';
      endTime = '06:00';
    }

    const response = {
      shift: primaryShift.charAt(0).toUpperCase() + primaryShift.slice(1),
      startTime: startTime,
      endTime: endTime,
      workingDays: workingDays,
      scheduleCount: schedules.length
    };

    res.json(response);
  } catch (e) {
    console.error('Error fetching shift schedule:', e);
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Update fields for the authenticated worker
exports.updateSelfWorker = async (req, res) => {
  try {
    const staffUserId = req.user._id;
    const allowed = [
      'name',
      'dateOfBirth',
      'contactNumber',
      'address',
      'emergencyContactName',
      'emergencyContactNumber',
      'aadhaarNumber',
      'photoUrl',
      'health',
      'origin',
      'dailyWage', // optional if allowed for self-edit; typically admin-only
    ];
    const update = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        // Handle health field specially for nested updates
        if (key === 'health' && typeof req.body[key] === 'object') {
          update['health'] = { ...req.body[key] };
        } else {
          update[key] = req.body[key];
        }
      }
    }
    
    // Ensure worker profile exists before updating
    let worker = await Worker.findOne({ user: staffUserId });
    if (!worker) {
      worker = await Worker.create({
        user: staffUserId,
        name: req.user.name || '',
        createdBy: staffUserId
      });
    }
    
    // Update the worker profile with proper handling of nested fields
    worker = await Worker.findOneAndUpdate(
      { user: staffUserId },
      { $set: update },
      { new: true, upsert: true }
    ).populate('user', 'name email role');
    
    res.json(worker);
  } catch (e) {
    console.error('Error in updateSelfWorker:', e);
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Add a document entry for the authenticated worker
exports.addSelfDocument = async (req, res) => {
  try {
    const staffUserId = req.user._id;
    const { label, url } = req.body || {};
    if (!url) return res.status(400).json({ message: 'url is required' });
    
    // Ensure worker profile exists
    let worker = await Worker.findOne({ user: staffUserId });
    if (!worker) {
      worker = await Worker.create({
        user: staffUserId,
        name: req.user.name || '',
        createdBy: staffUserId
      });
    }
    
    const doc = { label: label || '', url, uploadedAt: new Date() };
    worker = await Worker.findOneAndUpdate(
      { user: staffUserId },
      { $push: { documents: doc } },
      { new: true }
    );
    res.status(201).json(worker.documents);
  } catch (e) {
    console.error('Error in addSelfDocument:', e);
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Remove a document by index for the authenticated worker
exports.removeSelfDocument = async (req, res) => {
  try {
    const staffUserId = req.user._id;
    const idx = Number(req.params.idx);
    if (Number.isNaN(idx)) return res.status(400).json({ message: 'Invalid index' });
    
    // Ensure worker profile exists
    let worker = await Worker.findOne({ user: staffUserId });
    if (!worker) {
      worker = await Worker.create({
        user: staffUserId,
        name: req.user.name || '',
        createdBy: staffUserId
      });
    }
    
    if (!Array.isArray(worker.documents) || idx < 0 || idx >= worker.documents.length) {
      return res.status(400).json({ message: 'Index out of bounds' });
    }
    worker.documents.splice(idx, 1);
    await worker.save();
    res.json(worker.documents);
  } catch (e) {
    console.error('Error in removeSelfDocument:', e);
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Salary history for authenticated worker from SalarySummary
exports.getSelfSalaryHistory = async (req, res) => {
  try {
    const staffUserId = req.user._id;
    const history = await SalarySummary.find({ staff: staffUserId })
      .sort({ year: -1, month: -1 })
      .lean();
    res.json(history || []);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};





// --- Field Staff APIs ---
exports.addBarrelEntry = async (req, res) => {
  try {
    const staffId = req.user._id;
    const { farmerUserId, weightKg, ratePerKg, moisturePct, gps, photoUrl, routeTaskId, barrelId } = req.body;
    if (!farmerUserId || !weightKg || !ratePerKg) {
      return res.status(400).json({ message: 'farmerUserId, weightKg and ratePerKg are required' });
    }
    const amount = Number(weightKg) * Number(ratePerKg);
    const entry = await BarrelEntry.create({
      staff: staffId,
      farmerUser: farmerUserId,
      routeTaskId: routeTaskId || '',
      barrelId: barrelId || '',
      weightKg,
      ratePerKg,
      amount,
      moisturePct: moisturePct || 0,
      gps: gps || {},
      photoUrl: photoUrl || '',
    });
    res.status(201).json(entry);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.listBarrelEntries = async (req, res) => {
  try {
    const staffId = req.user._id;
    const { date } = req.query;
    const filter = { staff: staffId };
    if (date) {
      const start = new Date(date);
      start.setHours(0,0,0,0);
      const end = new Date(date);
      end.setHours(23,59,59,999);
      filter.dateTime = { $gte: start, $lte: end };
    }
    const list = await BarrelEntry.find(filter).sort({ dateTime: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.addTripLog = async (req, res) => {
  try {
    const staffId = req.user._id;
    const { vehicleId, odometerStart, odometerEnd, routeTaskId, date } = req.body;
    if (odometerStart == null || odometerEnd == null) {
      return res.status(400).json({ message: 'odometerStart and odometerEnd are required' });
    }
    if (Number(odometerEnd) < Number(odometerStart)) {
      return res.status(400).json({ message: 'odometerEnd must be >= odometerStart' });
    }
    const km = Number(odometerEnd) - Number(odometerStart);
    const log = await TripLog.create({
      staff: staffId,
      date: date ? new Date(date) : new Date(),
      vehicleId: vehicleId || '',
      odometerStart,
      odometerEnd,
      km,
      routeTaskId: routeTaskId || '',
    });
    res.status(201).json(log);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.listTripLogs = async (req, res) => {
  try {
    const staffId = req.user._id;
    const { date } = req.query;
    const filter = { staff: staffId };
    if (date) {
      const start = new Date(date);
      start.setHours(0,0,0,0);
      const end = new Date(date);
      end.setHours(23,59,59,999);
      filter.date = { $gte: start, $lte: end };
    }
    const list = await TripLog.find(filter).sort({ date: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.getTodaySnapshot = async (req, res) => {
  try {
    const staffId = req.user._id;
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);
    const [route] = await RouteTask.find({ staff: staffId, date: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).limit(1);
    const barrels = await BarrelEntry.find({ staff: staffId, dateTime: { $gte: start, $lte: end } }).sort({ dateTime: -1 });
    const trips = await TripLog.find({ staff: staffId, date: { $gte: start, $lte: end } }).sort({ date: -1 });
    // Include today's attendance record
    const attendance = await Attendance.findOne({ staff: staffId, date: start }).lean();
    res.json({ route: route || null, barrels, trips, attendance });
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.startRoute = async (req, res) => {
  try {
    const staffId = req.user._id;
    const today = new Date(); today.setHours(0,0,0,0);
    let route = await RouteTask.findOne({ staff: staffId, date: today });
    if (!route) {
      route = new RouteTask({ staff: staffId, date: today, status: 'in_progress', startedAt: new Date() });
    } else {
      route.status = 'in_progress';
      route.startedAt = new Date();
    }
    await route.save();
    res.json(route);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.completeRoute = async (req, res) => {
  try {
    const staffId = req.user._id;
    const today = new Date(); today.setHours(0,0,0,0);
    let route = await RouteTask.findOne({ staff: staffId, date: today });
    if (!route) return res.status(404).json({ message: 'Route not started' });
    route.status = 'completed';
    route.completedAt = new Date();
    await route.save();
    res.json(route);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// --- Attendance: self check-in/out, admin override ---
// Helper: get weekly schedule for a date and group ('field' | 'lab')
async function getWeekScheduleForDate(date, group = 'field') {
  const WeeklyShiftSchedule = require('../models/weeklyShiftScheduleModel');
  const weekStart = new Date(date);
  // Normalize to Sunday start (or adapt as needed)
  weekStart.setHours(0,0,0,0);
  const day = weekStart.getDay(); // 0..6; 0 = Sunday
  weekStart.setDate(weekStart.getDate() - day);
  return WeeklyShiftSchedule.findOne({ weekStart, group });
}

function parseHHMMToDate(baseDay, hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  const d = new Date(baseDay);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

exports.checkIn = async (req, res) => {
  try {
    const staffId = req.user._id;
    const { location, photo } = req.body;
    
    // Validate location
    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ message: 'Location is required for check-in' });
    }
    
    if (location.accuracy > 100) {
      return res.status(400).json({ message: 'GPS accuracy is too low. Please wait for better signal.' });
    }
    
    const today = new Date(); today.setHours(0,0,0,0);
    const existing = await Attendance.findOne({ staff: staffId, date: today });
    if (existing && existing.checkInAt) return res.status(400).json({ message: 'Already checked in' });
    const now = new Date();

    // Check if staff has a scheduled shift for today
    const sched = await getWeekScheduleForDate(today, 'field');
    if (!sched) {
      return res.status(400).json({ message: 'No schedule set for this week. Please contact your manager.' });
    }
    
    const assignment = (sched.assignments || []).find(a => String(a.staff) === String(staffId));
    if (!assignment) {
      return res.status(400).json({ message: 'You are not scheduled for today. Please contact your manager.' });
    }

    // Validate check-in time is within scheduled shift window
    const shiftStart = parseHHMMToDate(today, assignment.shiftType === 'Morning' ? sched.morningStart : sched.eveningStart);
    const shiftEnd = parseHHMMToDate(today, assignment.shiftType === 'Morning' ? sched.morningEnd : sched.eveningEnd);
    
    // Allow check-in 30 minutes before shift start and up to 1 hour after shift end
    const checkInWindowStart = new Date(shiftStart.getTime() - 30 * 60 * 1000);
    const checkInWindowEnd = new Date(shiftEnd.getTime() + 60 * 60 * 1000);
    
    if (now < checkInWindowStart) {
      const timeStr = shiftStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return res.status(400).json({ 
        message: `Check-in is only allowed 30 minutes before your shift starts. Your ${assignment.shiftType} shift starts at ${timeStr}.` 
      });
    }
    
    if (now > checkInWindowEnd) {
      const timeStr = shiftEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      return res.status(400).json({ 
        message: `Check-in window has expired. Your ${assignment.shiftType} shift ended at ${timeStr}. Please contact your manager.` 
      });
    }

    // Determine late threshold from weekly schedule
    let lateThreshold = new Date(today); lateThreshold.setHours(9, 15, 0, 0);
    if (sched) {
      const hhmm = assignment.shiftType === 'Morning' ? sched.morningStart : sched.eveningStart;
      // 15 min grace
      lateThreshold = parseHHMMToDate(today, hhmm);
      lateThreshold = new Date(lateThreshold.getTime() + 15 * 60 * 1000);
    }

    const rec = existing || new Attendance({ staff: staffId, date: today });
    rec.checkInAt = now;
    rec.isLate = now.getTime() > lateThreshold.getTime();
    
    // Store location data
    rec.checkInLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      address: location.address || ''
    };
    
    // Store photo data if provided
    if (photo) {
      rec.checkInPhoto = {
        url: photo.url || '',
        filename: photo.filename || '',
        uploadedAt: new Date()
      };
    }
    
    // Set verification flags
    rec.locationVerified = true;
    rec.photoVerified = !!photo;
    
    await rec.save();
    res.json(rec);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const staffId = req.user._id;
    const { location, photo } = req.body;
    
    // Validate location
    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ message: 'Location is required for check-out' });
    }
    
    if (location.accuracy > 100) {
      return res.status(400).json({ message: 'GPS accuracy is too low. Please wait for better signal.' });
    }
    
    const today = new Date(); today.setHours(0,0,0,0);
    const rec = await Attendance.findOne({ staff: staffId, date: today });
    if (!rec || !rec.checkInAt) return res.status(400).json({ message: 'Check-in required' });
    if (rec.checkOutAt) return res.status(400).json({ message: 'Already checked out' });
    
    rec.checkOutAt = new Date();
    
    // Store location data
    rec.checkOutLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      address: location.address || ''
    };
    
    // Store photo data if provided
    if (photo) {
      rec.checkOutPhoto = {
        url: photo.url || '',
        filename: photo.filename || '',
        uploadedAt: new Date()
      };
    }
    
    await rec.save();
    res.json(rec);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// (removed stray helper)

// Attendance history for staff (self)
exports.getAttendanceHistory = async (req, res) => {
  try {
    const staffId = req.user._id;
    const { from, to, limit = 60 } = req.query;
    const start = from ? new Date(from) : new Date(Date.now() - 30*24*60*60*1000);
    start.setHours(0,0,0,0);
    const end = to ? new Date(to) : new Date(); end.setHours(23,59,59,999);
    const list = await Attendance.find({ staff: staffId, date: { $gte: start, $lte: end } })
      .sort({ date: -1 })
      .limit(Number(limit));
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.adminMarkAttendance = async (req, res) => {
  try {
    const { staffId, date, checkInAt, checkOutAt, shiftId, notes, verified } = req.body;
    if (!staffId || !date) return res.status(400).json({ message: 'staffId and date required' });
    const day = new Date(date); day.setHours(0,0,0,0);
    const rec = await Attendance.findOneAndUpdate(
      { staff: staffId, date: day },
      { $set: { checkInAt: checkInAt ? new Date(checkInAt) : null, checkOutAt: checkOutAt ? new Date(checkOutAt) : null, shift: shiftId || null, notes: notes || '', verified: !!verified } },
      { upsert: true, new: true }
    );
    res.json(rec);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Admin list attendance for date range
exports.listAttendance = async (req, res) => {
  try {
    const { from, to, staffId } = req.query;
    const start = from ? new Date(from) : new Date('1970-01-01'); start.setHours(0,0,0,0);
    const end = to ? new Date(to) : new Date(); end.setHours(23,59,59,999);
    const filter = { date: { $gte: start, $lte: end } };
    if (staffId) filter.staff = staffId;
    const list = await Attendance.find(filter).populate('staff', 'name email').sort({ date: -1 });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Manager/Admin: verify an attendance record and optionally adjust notes/location flags
exports.verifyAttendance = async (req, res) => {
  try {
    const { attendanceId, verified = true, notes } = req.body || {};
    if (!attendanceId) return res.status(400).json({ message: 'attendanceId is required' });
    const rec = await Attendance.findById(attendanceId);
    if (!rec) return res.status(404).json({ message: 'Attendance not found' });
    rec.verified = !!verified;
    if (typeof notes === 'string') rec.notes = notes;
    await rec.save();
    res.json(rec);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Manager: Get attendance records for verification with GPS details
exports.getAttendanceForVerification = async (req, res) => {
  try {
    const { from, to, staffId, status = 'unverified' } = req.query;
    const start = from ? new Date(from) : new Date(Date.now() - 7*24*60*60*1000); 
    start.setHours(0,0,0,0);
    const end = to ? new Date(to) : new Date(); 
    end.setHours(23,59,59,999);
    
    let filter = { date: { $gte: start, $lte: end } };
    if (staffId) filter.staff = staffId;
    
    // Filter by verification status
    if (status === 'unverified') {
      filter.verified = { $ne: true };
    } else if (status === 'verified') {
      filter.verified = true;
    }
    
    const list = await Attendance.find(filter)
      .populate('staff', 'name email staffId')
      .sort({ date: -1, checkInAt: -1 });
    
    // Add GPS verification details
    const attendanceWithGPS = list.map(record => ({
      ...record.toObject(),
      gpsVerified: record.locationVerified,
      photoVerified: record.photoVerified,
      hasLocation: !!(record.checkInLocation && record.checkInLocation.latitude),
      hasPhoto: !!(record.checkInPhoto && record.checkInPhoto.url),
      locationAccuracy: record.checkInLocation?.accuracy || null
    }));
    
    res.json(attendanceWithGPS);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Manager: Bulk verify attendance records
exports.bulkVerifyAttendance = async (req, res) => {
  try {
    const { attendanceIds, verified = true, notes } = req.body;
    
    if (!attendanceIds || !Array.isArray(attendanceIds)) {
      return res.status(400).json({ message: 'attendanceIds array is required' });
    }
    
    const result = await Attendance.updateMany(
      { _id: { $in: attendanceIds } },
      { 
        $set: { 
          verified: !!verified,
          notes: notes || '',
          verifiedBy: req.user._id,
          verifiedAt: new Date()
        }
      }
    );
    
    res.json({
      message: `Successfully ${verified ? 'verified' : 'unverified'} ${result.modifiedCount} attendance records`,
      modifiedCount: result.modifiedCount
    });
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Manager: Get attendance statistics for dashboard
exports.getAttendanceStats = async (req, res) => {
  try {
    const { from, to } = req.query;
    const start = from ? new Date(from) : new Date(Date.now() - 30*24*60*60*1000);
    const end = to ? new Date(to) : new Date();
    
    const stats = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          verifiedRecords: {
            $sum: { $cond: ['$verified', 1, 0] }
          },
          unverifiedRecords: {
            $sum: { $cond: ['$verified', 0, 1] }
          },
          presentCount: {
            $sum: { $cond: ['$checkInAt', 1, 0] }
          },
          lateCount: {
            $sum: { $cond: ['$isLate', 1, 0] }
          },
          gpsVerifiedCount: {
            $sum: { $cond: ['$locationVerified', 1, 0] }
          },
          photoVerifiedCount: {
            $sum: { $cond: ['$photoVerified', 1, 0] }
          }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalRecords: 0,
      verifiedRecords: 0,
      unverifiedRecords: 0,
      presentCount: 0,
      lateCount: 0,
      gpsVerifiedCount: 0,
      photoVerifiedCount: 0
    };
    
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Attendance summary for today
exports.getTodayAttendanceSummary = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);
    const list = await Attendance.find({ date: { $gte: start, $lte: end } });
    const present = list.filter(r => !!r.checkInAt).length;
    const late = list.filter(r => !!r.checkInAt && r.isLate).length;
    // For absent, we need total staff count; approximate from users with role field_staff
    const User = require('../models/userModel');
    const totalStaff = await User.countDocuments({ role: { $in: ['field_staff', 'staff'] }, status: { $ne: 'deleted' } });
    const absent = Math.max(0, totalStaff - present);
    res.json({ present, absent, late });
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Attendance summary for current week (last 7 days)
exports.getWeekAttendanceSummary = async (req, res) => {
  try {
    const end = new Date(); end.setHours(23,59,59,999);
    const start = new Date(Date.now() - 6*24*60*60*1000); start.setHours(0,0,0,0);
    const list = await Attendance.find({ date: { $gte: start, $lte: end } });
    const present = list.filter(r => !!r.checkInAt).length;
    // Absences across week requires schedule; as a proxy, count days without check-in per staff is complex.
    res.json({ present, absences: 0 });
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    const staffId = req.params.staffId || req.user._id;
    const { year, month } = req.query; // month: 1-12
    
    // Validate ObjectId format if staffId is provided as parameter
    if (req.params.staffId && !req.params.staffId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid staffId format' });
    }
    
    if (!year || !month) return res.status(400).json({ message: 'year and month required' });

    // Count attendance days
    const from = new Date(Number(year), Number(month) - 1, 1);
    const to = new Date(Number(year), Number(month), 0); // last day
    to.setHours(23,59,59,999);

    const attendance = await Attendance.find({ staff: staffId, date: { $gte: from, $lte: to }, checkInAt: { $ne: null } });
    const workingDays = attendance.length;

    // Get dailyWage from Worker by user link
    const worker = await Worker.findOne({ user: staffId });
    const dailyWage = worker?.dailyWage || 0;
    const grossSalary = workingDays * dailyWage;

    // Update or create month summary while preserving payments and adjustments
    let summary = await SalarySummary.findOne({ staff: staffId, year: Number(year), month: Number(month) });
    if (!summary) {
      summary = await SalarySummary.create({ staff: staffId, year: Number(year), month: Number(month) });
    }
    summary.workingDays = workingDays;
    summary.dailyWage = dailyWage;
    summary.grossSalary = grossSalary;
    // Recompute pending = max(0, gross + bonus - deduction - received)
    summary.pendingAmount = Math.max(0, Number(summary.grossSalary) + Number(summary.bonusAmount || 0) - Number(summary.deductionAmount || 0) - Number(summary.receivedAmount || 0));
    await summary.save();

    res.json({
      workingDays,
      dailyWage,
      grossSalary,
      receivedAmount: summary.receivedAmount,
      advanceAmount: summary.advanceAmount,
      bonusAmount: summary.bonusAmount || 0,
      deductionAmount: summary.deductionAmount || 0,
      pendingAmount: summary.pendingAmount,
    });
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.staffDashboard = async (req, res) => {
  try {
    const staffId = req.user._id;
    const worker = await Worker.findOne({ user: staffId });
    const today = new Date(); today.setHours(0,0,0,0);
    const attendance = await Attendance.findOne({ staff: staffId, date: today });
    const route = await RouteTask.findOne({ staff: staffId, date: today }).sort({ createdAt: -1 });
    res.json({ worker, attendance, route });
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};


// --- Admin: record payroll ledger entry (received/advance/deduction/bonus) for a given month ---
exports.recordPayrollEntry = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { year, month, amount, type, note } = req.body || {};
    
    // Validate ObjectId format
    if (!staffId || !staffId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid staffId format' });
    }
    
    if (!year || !month || !amount || !type) {
      return res.status(400).json({ message: 'year, month, amount, type required' });
    }
    const t = String(type);
    if (!['received', 'advance', 'deduction', 'bonus'].includes(t)) {
      return res.status(400).json({ message: 'type must be received, advance, deduction, or bonus' });
    }

    // Ensure a summary exists
    let summary = await SalarySummary.findOne({ staff: staffId, year: Number(year), month: Number(month) });
    if (!summary) {
      summary = await SalarySummary.create({ staff: staffId, year: Number(year), month: Number(month) });
    }

    // Create ledger entry
    await PayrollEntry.create({ staff: staffId, year: Number(year), month: Number(month), type: t, amount: Number(amount), note: note || '', createdBy: req.user?._id });

    // Update summary totals
    if (t === 'received') summary.receivedAmount = Number(summary.receivedAmount) + Number(amount);
    if (t === 'advance') summary.advanceAmount = Number(summary.advanceAmount) + Number(amount);
    if (t === 'bonus') summary.bonusAmount = Number(summary.bonusAmount || 0) + Number(amount);
    if (t === 'deduction') summary.deductionAmount = Number(summary.deductionAmount || 0) + Number(amount);

    // Recompute pending = max(0, gross + bonus - deduction - received)
    summary.pendingAmount = Math.max(0, Number(summary.grossSalary) + Number(summary.bonusAmount || 0) - Number(summary.deductionAmount || 0) - Number(summary.receivedAmount || 0));
    await summary.save();

    res.json(summary);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// --- Admin: list payroll ledger entries for a given staff and month ---
exports.listPayrollEntries = async (req, res) => {
  try {
    const { staffId } = req.params;
    const { year, month } = req.query;
    
    // Validate ObjectId format
    if (!staffId || !staffId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid staffId format' });
    }
    
    if (!year || !month) return res.status(400).json({ message: 'year, month required' });
    const entries = await PayrollEntry.find({ staff: staffId, year: Number(year), month: Number(month) }).sort({ createdAt: -1 }).lean();
    res.json(entries);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// --- Staff: view own payroll ledger for a month ---
exports.listMyPayrollEntries = async (req, res) => {
  try {
    const staffId = req.user._id;
    const { year, month } = req.query;
    if (!year || !month) return res.status(400).json({ message: 'year, month required' });
    const entries = await PayrollEntry.find({ staff: staffId, year: Number(year), month: Number(month) }).sort({ createdAt: -1 }).lean();
    res.json(entries);
  } catch (e) {
    res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

