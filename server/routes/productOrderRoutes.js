const express = require('express');
const router = express.Router();
const {
    createOrder,
    getMyOrders,
    getAllOrders,
    assignStaff,
    updateOrderBilling,
    approveOrder,
    deleteOrder
} = require('../controllers/productOrderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// User routes
router.route('/')
    .post(protect, createOrder)
    .get(protect, authorize('manager', 'accountant', 'admin'), getAllOrders);

router.get('/my-orders', protect, getMyOrders);

// Accountant routes
router.put('/:id/bill', protect, authorize('accountant', 'admin'), updateOrderBilling);

// Manager routes
router.put('/:id/assign', protect, authorize('manager', 'admin'), assignStaff);
router.put('/:id/approve', protect, authorize('manager', 'admin'), approveOrder);
router.delete('/:id', protect, authorize('manager', 'admin'), deleteOrder);

module.exports = router;
