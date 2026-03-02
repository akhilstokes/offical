const Vehicle = require('../models/vehicleModel');
const Alert = require('../models/alertModel');
const User = require('../models/userModel');

// Create vehicle (Admin only)
exports.createVehicle = async (req, res) => {
  try {
    const {
      vehicleNumber,
      vehicleType,
      insuranceStartDate,
      insuranceExpiryDate,
      rcNumber,
      pollutionExpiryDate,
      status,
      assignedDriver
    } = req.body;

    // Validate required fields
    if (!vehicleNumber || !vehicleType || !insuranceStartDate || !insuranceExpiryDate || !rcNumber || !pollutionExpiryDate) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided',
        required: ['vehicleNumber', 'vehicleType', 'insuranceStartDate', 'insuranceExpiryDate', 'rcNumber', 'pollutionExpiryDate']
      });
    }

    // Check if vehicle number already exists
    const existingVehicle = await Vehicle.findOne({ vehicleNumber: vehicleNumber.toUpperCase() });
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this number already exists'
      });
    }

    // Validate assigned driver if provided
    if (assignedDriver) {
      const driver = await User.findById(assignedDriver);
      if (!driver) {
        return res.status(404).json({
          success: false,
          message: 'Assigned driver not found'
        });
      }
      if (driver.role !== 'delivery_staff' && driver.role !== 'delivery') {
        return res.status(400).json({
          success: false,
          message: 'Assigned user must be a delivery staff member'
        });
      }
    }

    // Create vehicle
    const vehicle = await Vehicle.create({
      vehicleNumber: vehicleNumber.toUpperCase(),
      vehicleType,
      insuranceStartDate,
      insuranceExpiryDate,
      rcNumber: rcNumber.toUpperCase(),
      pollutionExpiryDate,
      status: status || 'Active',
      assignedDriver: assignedDriver || null,
      createdBy: req.user._id
    });

    await vehicle.populate('assignedDriver', 'name email phoneNumber role');
    await vehicle.populate('createdBy', 'name email');

    return res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      vehicle
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while creating vehicle',
      error: error.message
    });
  }
};

// Get all vehicles (Admin, Manager, Delivery)
exports.getAllVehicles = async (req, res) => {
  try {
    const { status, vehicleType, search, page = 1, limit = 20 } = req.query;
    const userRole = req.user.role;

    // Build query
    const query = {};

    // Role-based filtering
    if (userRole === 'delivery_staff' || userRole === 'delivery') {
      // Delivery staff can only see their assigned vehicle
      query.assignedDriver = req.user._id;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Vehicle type filter
    if (vehicleType) {
      query.vehicleType = vehicleType;
    }

    // Search by vehicle number or RC number
    if (search) {
      query.$or = [
        { vehicleNumber: { $regex: search, $options: 'i' } },
        { rcNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const vehicles = await Vehicle.find(query)
      .populate('assignedDriver', 'name email phoneNumber role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Vehicle.countDocuments(query);

    // Add expiry status to each vehicle
    const vehiclesWithStatus = vehicles.map(vehicle => {
      const vehicleObj = vehicle.toObject({ virtuals: true });
      vehicleObj.expiryStatus = vehicle.getExpiryStatus();
      return vehicleObj;
    });

    return res.json({
      success: true,
      vehicles: vehiclesWithStatus,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching vehicles',
      error: error.message
    });
  }
};

// Get single vehicle by ID
exports.getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    const vehicle = await Vehicle.findById(id)
      .populate('assignedDriver', 'name email phoneNumber role')
      .populate('createdBy', 'name email');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check access permissions
    if (userRole === 'delivery_staff' || userRole === 'delivery') {
      if (!vehicle.assignedDriver || vehicle.assignedDriver._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your assigned vehicle'
        });
      }
    }

    const vehicleObj = vehicle.toObject({ virtuals: true });
    vehicleObj.expiryStatus = vehicle.getExpiryStatus();

    return res.json({
      success: true,
      vehicle: vehicleObj
    });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching vehicle',
      error: error.message
    });
  }
};

// Update vehicle (Admin full access, Manager status only)
exports.updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Manager can only update status
    if (userRole === 'manager') {
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required'
        });
      }

      if (!['Active', 'Maintenance', 'Inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value'
        });
      }

      vehicle.status = status;
      await vehicle.save();

      await vehicle.populate('assignedDriver', 'name email phoneNumber role');
      await vehicle.populate('createdBy', 'name email');

      return res.json({
        success: true,
        message: 'Vehicle status updated successfully',
        vehicle
      });
    }

    // Admin can update all fields
    const {
      vehicleNumber,
      vehicleType,
      insuranceStartDate,
      insuranceExpiryDate,
      rcNumber,
      pollutionExpiryDate,
      status,
      assignedDriver
    } = req.body;

    // Check if vehicle number is being changed and if it already exists
    if (vehicleNumber && vehicleNumber.toUpperCase() !== vehicle.vehicleNumber) {
      const existingVehicle = await Vehicle.findOne({ vehicleNumber: vehicleNumber.toUpperCase() });
      if (existingVehicle) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle with this number already exists'
        });
      }
      vehicle.vehicleNumber = vehicleNumber.toUpperCase();
    }

    // Validate assigned driver if provided
    if (assignedDriver !== undefined) {
      if (assignedDriver) {
        const driver = await User.findById(assignedDriver);
        if (!driver) {
          return res.status(404).json({
            success: false,
            message: 'Assigned driver not found'
          });
        }
        if (driver.role !== 'delivery_staff' && driver.role !== 'delivery') {
          return res.status(400).json({
            success: false,
            message: 'Assigned user must be a delivery staff member'
          });
        }
      }
      vehicle.assignedDriver = assignedDriver || null;
    }

    // Update other fields
    if (vehicleType) vehicle.vehicleType = vehicleType;
    if (insuranceStartDate) vehicle.insuranceStartDate = insuranceStartDate;
    if (insuranceExpiryDate) vehicle.insuranceExpiryDate = insuranceExpiryDate;
    if (rcNumber) vehicle.rcNumber = rcNumber.toUpperCase();
    if (pollutionExpiryDate) vehicle.pollutionExpiryDate = pollutionExpiryDate;
    if (status) vehicle.status = status;

    await vehicle.save();

    await vehicle.populate('assignedDriver', 'name email phoneNumber role');
    await vehicle.populate('createdBy', 'name email');

    return res.json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error while updating vehicle',
      error: error.message
    });
  }
};

// Delete vehicle (Admin only)
exports.deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Delete associated alerts
    await Alert.deleteMany({ vehicleId: id });

    await vehicle.deleteOne();

    return res.json({
      success: true,
      message: 'Vehicle and associated alerts deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting vehicle',
      error: error.message
    });
  }
};

// Get assigned vehicle (Delivery staff)
exports.getAssignedVehicle = async (req, res) => {
  try {
    const userId = req.user._id;

    const vehicle = await Vehicle.findOne({ assignedDriver: userId })
      .populate('createdBy', 'name email');

    if (!vehicle) {
      return res.json({
        success: true,
        message: 'No vehicle assigned',
        vehicle: null
      });
    }

    const vehicleObj = vehicle.toObject({ virtuals: true });
    vehicleObj.expiryStatus = vehicle.getExpiryStatus();

    return res.json({
      success: true,
      vehicle: vehicleObj
    });
  } catch (error) {
    console.error('Error fetching assigned vehicle:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching assigned vehicle',
      error: error.message
    });
  }
};

// Get vehicle alerts (Delivery staff)
exports.getVehicleAlerts = async (req, res) => {
  try {
    const userId = req.user._id;
    const { isRead, page = 1, limit = 20 } = req.query;

    // Build query
    const query = { userId };
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const alerts = await Alert.find(query)
      .populate('vehicleId', 'vehicleNumber vehicleType status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Alert.countDocuments(query);
    const unreadCount = await Alert.countDocuments({ userId, isRead: false });

    return res.json({
      success: true,
      alerts,
      unreadCount,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching alerts',
      error: error.message
    });
  }
};

// Mark alert as read (Delivery staff)
exports.markAlertAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const alert = await Alert.findOne({ _id: id, userId });
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    alert.isRead = true;
    await alert.save();

    return res.json({
      success: true,
      message: 'Alert marked as read',
      alert
    });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while marking alert as read',
      error: error.message
    });
  }
};

// Mark all alerts as read (Delivery staff)
exports.markAllAlertsAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Alert.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    return res.json({
      success: true,
      message: 'All alerts marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all alerts as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while marking alerts as read',
      error: error.message
    });
  }
};

// Check vehicle eligibility for delivery
exports.checkVehicleEligibility = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const now = new Date();
    const insuranceValid = vehicle.insuranceExpiryDate > now;
    const pollutionValid = vehicle.pollutionExpiryDate > now;
    const statusValid = vehicle.status === 'Active';

    const isEligible = insuranceValid && pollutionValid && statusValid;

    const issues = [];
    if (!insuranceValid) issues.push('Insurance expired');
    if (!pollutionValid) issues.push('Pollution certificate expired');
    if (!statusValid) issues.push(`Vehicle status is ${vehicle.status}`);

    return res.json({
      success: true,
      isEligible,
      vehicle: {
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        status: vehicle.status
      },
      checks: {
        insurance: insuranceValid,
        pollution: pollutionValid,
        status: statusValid
      },
      issues: issues.length > 0 ? issues : null,
      message: isEligible 
        ? 'Vehicle is eligible for delivery' 
        : `Vehicle not eligible: ${issues.join(', ')}`
    });
  } catch (error) {
    console.error('Error checking vehicle eligibility:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while checking vehicle eligibility',
      error: error.message
    });
  }
};

module.exports = exports;
