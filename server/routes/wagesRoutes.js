const express = require('express');
const router = express.Router();
const { protect, admin, adminOrManager } = require('../middleware/authMiddleware');
const wagesController = require('../controllers/wagesController');

// All routes require authentication
router.use(protect);

// Note: Rate limiting temporarily disabled to prevent 429 errors during development
// router.use(wagesRateLimiter);

// GET /api/wages/staff - Get staff by role
router.get('/staff', wagesController.getStaffByRole);

// GET /api/wages/my-wages - Get my wages (for delivery staff)
router.get('/my-wages', wagesController.getMyWages);

// GET /api/wages/payslips - Get payslips
router.get('/payslips', wagesController.getPayslips);

// POST /api/wages/payslips - Create payslip
router.post('/payslips', adminOrManager, wagesController.createPayslip);

// PUT /api/wages/payslips/:id - Update payslip
router.put('/payslips/:id', adminOrManager, wagesController.updatePayslip);

// DELETE /api/wages/payslips/:id - Delete payslip
router.delete('/payslips/:id', admin, wagesController.deletePayslip);

// GET /api/wages/all - Get all wage entries
router.get('/all', wagesController.getAllWages);

// POST /api/wages/create - Create wage entry
router.post('/create', adminOrManager, wagesController.createWage);

module.exports = router;
