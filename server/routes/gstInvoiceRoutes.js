const express = require('express');
const router = express.Router();
const gstInvoiceController = require('../controllers/gstInvoiceController');
const { protect } = require('../middleware/authMiddleware');

// Invoice routes
router.post('/', protect, gstInvoiceController.createInvoice);
router.get('/', protect, gstInvoiceController.getAllInvoices);
router.get('/user/my-invoices', protect, gstInvoiceController.getUserInvoices);
router.get('/company-settings', protect, gstInvoiceController.getCompanySettings);
router.get('/:id', protect, gstInvoiceController.getInvoiceById);
router.patch('/:id/status', protect, gstInvoiceController.updateInvoiceStatus);
router.post('/:id/send-to-user', protect, gstInvoiceController.sendInvoiceToUser);
router.delete('/:id', protect, gstInvoiceController.deleteInvoice);

module.exports = router;
