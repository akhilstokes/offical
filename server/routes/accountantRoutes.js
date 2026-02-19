const express = require('express');
const router = express.Router();
const { protect, adminManagerAccountant } = require('../middleware/authMiddleware');
const accountantController = require('../controllers/accountantController');

// Time tracking endpoints
router.get('/time-tracking', protect, adminManagerAccountant, accountantController.getTimeTracking);
router.get('/time-tracking/summary', protect, adminManagerAccountant, accountantController.getTimeTrackingSummary);
router.get('/time-tracking/export', protect, adminManagerAccountant, accountantController.exportTimeTracking);

// Financial reports
router.get('/financial-reports/daily', protect, adminManagerAccountant, accountantController.getDailyFinancialReport);
router.get('/financial-reports/monthly', protect, adminManagerAccountant, accountantController.getMonthlyFinancialReport);
router.get('/financial-reports/yearly', protect, adminManagerAccountant, accountantController.getYearlyFinancialReport);

// Staff salary overview
router.get('/staff-salary-overview', protect, adminManagerAccountant, accountantController.getStaffSalaryOverview);

// Overtime calculations
router.get('/overtime-calculations', protect, adminManagerAccountant, accountantController.getOvertimeCalculations);
router.post('/overtime-calculations/approve', protect, adminManagerAccountant, accountantController.approveOvertime);

// Invoice summary
router.get('/invoice-summary', protect, adminManagerAccountant, accountantController.getInvoiceSummary);

// Payment reconciliation
router.get('/payment-reconciliation', protect, adminManagerAccountant, accountantController.getPaymentReconciliationReport);

// Tax Filing CRUD
router.get('/tax/filing', protect, adminManagerAccountant, accountantController.getTaxData);
router.post('/tax/record', protect, adminManagerAccountant, accountantController.addTaxRecord);
router.put('/tax/record/:id', protect, adminManagerAccountant, accountantController.updateTaxRecord);
router.delete('/tax/record/:id', protect, adminManagerAccountant, accountantController.deleteTaxRecord);

// Document Management
router.get('/documents', protect, adminManagerAccountant, accountantController.getDocuments);
const upload = require('../middleware/uploadMiddleware');
router.post('/documents/upload', protect, adminManagerAccountant, upload.single('file'), accountantController.uploadDocument);
router.get('/documents/:id/download', protect, adminManagerAccountant, accountantController.downloadDocument);
router.delete('/documents/:id', protect, adminManagerAccountant, accountantController.deleteDocument);

module.exports = router;
