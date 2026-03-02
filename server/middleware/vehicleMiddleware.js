const Vehicle = require('../models/vehicleModel');

// Middleware to validate vehicle eligibility before delivery creation
exports.validateVehicleForDelivery = async (req, res, next) => {
  try {
    const { vehicleId, assignedTo } = req.body;

    // If no vehicle specified, skip validation
    if (!vehicleId && !assignedTo) {
      return next();
    }

    let vehicle;

    // Find vehicle by ID or by assigned driver
    if (vehicleId) {
      vehicle = await Vehicle.findById(vehicleId);
    } else if (assignedTo) {
      vehicle = await Vehicle.findOne({ assignedDriver: assignedTo });
    }

    // If no vehicle found, allow creation (vehicle assignment is optional)
    if (!vehicle) {
      return next();
    }

    // Check vehicle eligibility
    const now = new Date();
    const insuranceValid = vehicle.insuranceExpiryDate > now;
    const pollutionValid = vehicle.pollutionExpiryDate > now;
    const statusValid = vehicle.status === 'Active';

    if (!insuranceValid || !pollutionValid || !statusValid) {
      const issues = [];
      if (!insuranceValid) issues.push('insurance expired');
      if (!pollutionValid) issues.push('pollution certificate expired');
      if (!statusValid) issues.push(`vehicle status is ${vehicle.status}`);

      return res.status(400).json({
        success: false,
        message: `Vehicle not eligible for delivery due to compliance issue: ${issues.join(', ')}`,
        vehicle: {
          vehicleNumber: vehicle.vehicleNumber,
          status: vehicle.status,
          insuranceExpiry: vehicle.insuranceExpiryDate,
          pollutionExpiry: vehicle.pollutionExpiryDate
        },
        issues
      });
    }

    // Attach vehicle to request for use in controller
    req.vehicle = vehicle;
    next();
  } catch (error) {
    console.error('Error validating vehicle:', error);
    return res.status(500).json({
      success: false,
      message: 'Error validating vehicle eligibility',
      error: error.message
    });
  }
};

// Middleware to check expiry status and auto-update vehicle status
exports.checkAndUpdateVehicleStatus = async (req, res, next) => {
  try {
    const now = new Date();

    // Find all vehicles with expired documents
    const expiredVehicles = await Vehicle.find({
      $or: [
        { insuranceExpiryDate: { $lte: now } },
        { pollutionExpiryDate: { $lte: now } }
      ],
      status: { $ne: 'Inactive' }
    });

    // Update status to Inactive for expired vehicles
    for (const vehicle of expiredVehicles) {
      vehicle.status = 'Inactive';
      await vehicle.save();
      console.log(`Vehicle ${vehicle.vehicleNumber} automatically set to Inactive due to expired documents`);
    }

    next();
  } catch (error) {
    console.error('Error checking vehicle status:', error);
    // Don't block the request, just log the error
    next();
  }
};

// Middleware to validate vehicle data
exports.validateVehicleData = (req, res, next) => {
  const {
    vehicleNumber,
    vehicleType,
    insuranceStartDate,
    insuranceExpiryDate,
    rcNumber,
    pollutionExpiryDate
  } = req.body;

  const errors = [];

  // Validate vehicle number format (alphanumeric, 5-15 characters)
  if (vehicleNumber && !/^[A-Z0-9]{5,15}$/i.test(vehicleNumber)) {
    errors.push('Vehicle number must be 5-15 alphanumeric characters');
  }

  // Validate vehicle type
  if (vehicleType && !['Truck', 'Van', 'Bike'].includes(vehicleType)) {
    errors.push('Vehicle type must be Truck, Van, or Bike');
  }

  // Validate RC number format (alphanumeric, 5-20 characters)
  if (rcNumber && !/^[A-Z0-9]{5,20}$/i.test(rcNumber)) {
    errors.push('RC number must be 5-20 alphanumeric characters');
  }

  // Validate date logic
  if (insuranceStartDate && insuranceExpiryDate) {
    const startDate = new Date(insuranceStartDate);
    const expiryDate = new Date(insuranceExpiryDate);
    
    if (expiryDate <= startDate) {
      errors.push('Insurance expiry date must be after start date');
    }
  }

  // Validate pollution expiry is not in the past (for new vehicles)
  if (pollutionExpiryDate && req.method === 'POST') {
    const pollutionDate = new Date(pollutionExpiryDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    if (pollutionDate < now) {
      errors.push('Pollution expiry date cannot be in the past');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = exports;
