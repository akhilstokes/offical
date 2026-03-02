const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  vehicleType: {
    type: String,
    enum: ['Truck', 'Van', 'Bike'],
    required: [true, 'Vehicle type is required']
  },
  insuranceStartDate: {
    type: Date,
    required: [true, 'Insurance start date is required']
  },
  insuranceExpiryDate: {
    type: Date,
    required: [true, 'Insurance expiry date is required'],
    validate: {
      validator: function(value) {
        return value > this.insuranceStartDate;
      },
      message: 'Insurance expiry date must be after start date'
    }
  },
  rcNumber: {
    type: String,
    required: [true, 'RC number is required'],
    trim: true,
    uppercase: true
  },
  pollutionExpiryDate: {
    type: Date,
    required: [true, 'Pollution expiry date is required'],
    validate: {
      validator: function(value) {
        // Don't allow past dates during creation
        if (this.isNew) {
          return value >= new Date();
        }
        return true;
      },
      message: 'Pollution expiry date cannot be in the past'
    }
  },
  status: {
    type: String,
    enum: ['Active', 'Maintenance', 'Inactive'],
    default: 'Active'
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
vehicleSchema.index({ vehicleNumber: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ assignedDriver: 1 });

// Virtual for checking if vehicle is eligible for delivery
vehicleSchema.virtual('isEligibleForDelivery').get(function() {
  const now = new Date();
  const insuranceValid = this.insuranceExpiryDate > now;
  const pollutionValid = this.pollutionExpiryDate > now;
  const statusValid = this.status === 'Active';
  
  return insuranceValid && pollutionValid && statusValid;
});

// Method to check expiry status
vehicleSchema.methods.getExpiryStatus = function() {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const status = {
    insurance: 'valid',
    pollution: 'valid',
    needsAttention: false
  };
  
  // Check insurance
  if (this.insuranceExpiryDate <= now) {
    status.insurance = 'expired';
    status.needsAttention = true;
  } else if (this.insuranceExpiryDate <= sevenDaysFromNow) {
    status.insurance = 'expiring_soon';
    status.needsAttention = true;
  }
  
  // Check pollution
  if (this.pollutionExpiryDate <= now) {
    status.pollution = 'expired';
    status.needsAttention = true;
  } else if (this.pollutionExpiryDate <= sevenDaysFromNow) {
    status.pollution = 'expiring_soon';
    status.needsAttention = true;
  }
  
  return status;
};

// Pre-save middleware to validate dates
vehicleSchema.pre('save', function(next) {
  // Validate insurance dates
  if (this.insuranceExpiryDate <= this.insuranceStartDate) {
    return next(new Error('Insurance expiry date must be after start date'));
  }
  
  // Check if expiry dates are in the past during creation
  if (this.isNew) {
    const now = new Date();
    if (this.insuranceExpiryDate < now) {
      return next(new Error('Insurance expiry date cannot be in the past'));
    }
    if (this.pollutionExpiryDate < now) {
      return next(new Error('Pollution expiry date cannot be in the past'));
    }
  }
  
  next();
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

module.exports = Vehicle;
