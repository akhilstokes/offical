const express = require('express');
const router = express.Router();
const { protect, adminOrManager, adminManagerAccountant } = require('../middleware/authMiddleware');
const invoiceController = require('../controllers/invoiceController');

// Create invoice (Accountant can create)
router.post('/', protect, adminManagerAccountant, invoiceController.createInvoice);

// Get all invoices (Admin/Manager/Accountant)
router.get('/', protect, adminManagerAccountant, invoiceController.getInvoices);

// Get my invoices (Customer)
router.get('/my', protect, invoiceController.getMyInvoices);

// Get specific invoice
router.get('/:invoiceId', protect, invoiceController.getInvoice);

// Approve invoice (Manager/Admin only)
router.put('/:invoiceId/approve', protect, adminOrManager, invoiceController.approveInvoice);

// Record payment
router.post('/:invoiceId/payment', protect, adminManagerAccountant, invoiceController.recordPayment);

// Get payment history
router.get('/payments/history', protect, invoiceController.getPaymentHistory);

// Get financial summary
router.get('/financial/summary', protect, adminManagerAccountant, invoiceController.getFinancialSummary);

module.exports = router;
