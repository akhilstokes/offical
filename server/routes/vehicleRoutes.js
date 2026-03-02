const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to check roles
const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

// Admin Routes - Full CRUD access
router.post(
  '/',
  protect,
  checkRole('admin'),
  vehicleController.createVehicle
);

router.put(
  '/:id',
  protect,
  checkRole('admin', 'manager'),
  vehicleController.updateVehicle
);

router.delete(
  '/:id',
  protect,
  checkRole('admin'),
  vehicleController.deleteVehicle
);

// Manager Routes - Status update only (handled in controller)
router.patch(
  '/:id/status',
  protect,
  checkRole('manager'),
  vehicleController.updateVehicle
);

// Shared Routes - Admin, Manager, Delivery
router.get(
  '/',
  protect,
  checkRole('admin', 'manager', 'delivery_staff', 'delivery', 'accountant'),
  vehicleController.getAllVehicles
);

router.get(
  '/:id',
  protect,
  checkRole('admin', 'manager', 'delivery_staff', 'delivery', 'accountant'),
  vehicleController.getVehicleById
);

// Delivery Staff Routes
router.get(
  '/assigned/me',
  protect,
  checkRole('delivery_staff', 'delivery'),
  vehicleController.getAssignedVehicle
);

router.get(
  '/alerts/me',
  protect,
  checkRole('delivery_staff', 'delivery'),
  vehicleController.getVehicleAlerts
);

router.patch(
  '/alerts/:id/read',
  protect,
  checkRole('delivery_staff', 'delivery'),
  vehicleController.markAlertAsRead
);

router.patch(
  '/alerts/read-all',
  protect,
  checkRole('delivery_staff', 'delivery'),
  vehicleController.markAllAlertsAsRead
);

// Vehicle eligibility check (Admin, Manager)
router.get(
  '/:vehicleId/eligibility',
  protect,
  checkRole('admin', 'manager'),
  vehicleController.checkVehicleEligibility
);

module.exports = router;
