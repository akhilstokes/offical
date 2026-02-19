const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const billController = require('../controllers/billController');

// Accountant routes
router.post('/', protect, billController.createBill);
router.get('/accountant/pending', protect, billController.getAccountantBills);

// Manager routes
router.get('/manager/pending', protect, billController.getManagerPendingBills);
router.get('/manager/all-bills', protect, billController.getManagerAllBills);
router.put('/:id/verify', protect, billController.verifyBill);
router.put('/:id/approve-pay', protect, billController.approveAndPayBill);
router.put('/:id/reject', protect, billController.rejectBill);

// User routes
router.get('/user/my-bills', protect, billController.getUserBills);
router.get('/:id', protect, billController.getBillById);

// Admin routes
router.get('/all', protect, billController.getAllBills);

module.exports = router;
