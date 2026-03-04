const express = require('express');
const router = express.Router();
const { protect, adminOrManager } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/requestController');

// Barrel requests (user endpoints)
router.post('/', protect, ctrl.createBarrelRequest);
router.get('/my', protect, ctrl.listMyBarrelRequests);

// Admin/Manager endpoints
router.get('/admin/all', protect, adminOrManager, ctrl.listAllBarrelRequests);
router.get('/manager/all', protect, adminOrManager, ctrl.listAllBarrelRequests);
router.put('/:id/approve', protect, adminOrManager, ctrl.approveBarrelRequest);
router.put('/:id/reject', protect, adminOrManager, ctrl.rejectBarrelRequest);
router.put('/:id/assign', protect, adminOrManager, ctrl.assignBarrelRequest);

module.exports = router;

