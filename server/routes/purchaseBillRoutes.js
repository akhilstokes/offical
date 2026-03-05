const express = require('express');
const router = express.Router();
const {
    createPurchaseBill,
    getPurchaseBills,
    getPurchaseBill,
    updatePurchaseBill,
    deletePurchaseBill,
    getPurchaseBillStats
} = require('../controllers/purchaseBillController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Stats route (must be before /:id route)
router.get('/stats', authorize('admin', 'accountant'), getPurchaseBillStats);

// Main CRUD routes
router.route('/')
    .get(authorize('admin', 'accountant'), getPurchaseBills)
    .post(authorize('admin', 'accountant'), createPurchaseBill);

router.route('/:id')
    .get(authorize('admin', 'accountant'), getPurchaseBill)
    .put(authorize('admin', 'accountant'), updatePurchaseBill)
    .delete(authorize('admin'), deletePurchaseBill);

module.exports = router;
