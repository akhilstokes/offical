const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const staffScheduleController = require('../controllers/staffScheduleController');

// All routes require authentication and manager role
router.use(protect);

// Get schedule history with filters (must be before '/' route)
router.get('/history', staffScheduleController.getScheduleHistory);

// Bulk assign schedules
router.post('/bulk-assign', staffScheduleController.bulkAssignSchedule);

// Get schedules by date range
router.get('/', staffScheduleController.getSchedulesByDateRange);

// Get schedule for specific staff
router.get('/staff/:staffId', staffScheduleController.getStaffSchedule);

// Delete schedule
router.delete('/:scheduleId', staffScheduleController.deleteSchedule);

module.exports = router;
