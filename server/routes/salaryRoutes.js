const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Calculate wages (preview before generating)
router.post('/calculate', protect, authorize('admin', 'accountant'), salaryController.calculateWages);

// Generate salary record
router.post('/generate', protect, authorize('admin', 'accountant'), salaryController.generateSalaryRecord);

// Get all salary records (for all staff)
router.get('/all', protect, authorize('admin', 'accountant', 'manager'), salaryController.getAllSalaryRecords);

// Get salary history for a specific staff member
router.get('/history/:staffId', protect, authorize('admin', 'accountant', 'manager'), salaryController.getSalaryHistory);

// Get all salary records
router.get('/', protect, authorize('admin', 'accountant', 'manager'), salaryController.getAllSalaryRecords);

// Get salary statistics
router.get('/statistics', protect, authorize('admin', 'accountant'), salaryController.getSalaryStatistics);

// Get my salary (for staff)
router.get('/my-salary', protect, salaryController.getMySalary);

// Get salary record by ID
router.get('/:id', protect, salaryController.getSalaryRecordById);

// Update salary record
router.put('/:id', protect, authorize('admin', 'accountant'), salaryController.updateSalaryRecord);

// Approve salary record
router.patch('/:id/approve', protect, authorize('admin', 'manager'), salaryController.approveSalaryRecord);

// Mark as paid
router.patch('/:id/pay', protect, authorize('admin', 'accountant'), salaryController.markAsPaid);

// Delete salary record
router.delete('/:id', protect, authorize('admin'), salaryController.deleteSalaryRecord);

module.exports = router;
