const mongoose = require('mongoose');

// Sub-schema for DRC measurements
const drcSchema = new mongoose.Schema({
  w1: {
    type: Number,
    required: true,
    min: 0
  },
  w2: {
    type: Number,
    required: true,
    min: 0
  },
  value: {
    type: Number,
    required: true
  }
}, { _id: false });

// Sub-schema for TSC measurements
const tscSchema = new mongoose.Schema({
  w1: {
    type: Number,
    required: true,
    min: 0
  },
  w2: {
    type: Number,
    required: true,
    min: 0
  },
  value: {
    type: Number,
    required: true
  }
}, { _id: false });

// Sub-schema for barrel data
const barrelSchema = new mongoose.Schema({
  barrelNumber: {
    type: Number,
    required: true
  },
  drc: {
    type: drcSchema,
    required: true
  },
  tsc: {
    type: tscSchema,
    required: true
  },
  ph: {
    type: Number,
    required: true,
    min: 0,
    max: 14
  }
}, { _id: false });

const sampleSchema = new mongoose.Schema({
  sampleId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  receivedAt: {
    type: Date,
    default: Date.now
  },
  barrels: {
    type: [barrelSchema],
    required: true,
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one barrel is required'
    }
  },
  notes: {
    type: String,
    trim: true
  },
  labStaff: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending_billing', 'billed', 'completed'],
    default: 'pending_billing'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save validation and recalculation
sampleSchema.pre('save', function(next) {
  // Validate and recalculate each barrel
  for (let barrel of this.barrels) {
    // DRC validations
    if (barrel.drc.w2 === 0) {
      return next(new Error(`Barrel ${barrel.barrelNumber}: W2_DRC cannot be zero`));
    }
    
    if (barrel.drc.w1 > barrel.drc.w2) {
      return next(new Error(`Barrel ${barrel.barrelNumber}: W1_DRC must be ≤ W2_DRC`));
    }
    
    // TSC validations
    if (barrel.tsc.w2 === 0) {
      return next(new Error(`Barrel ${barrel.barrelNumber}: W2_TSC cannot be zero`));
    }
    
    if (barrel.tsc.w1 > barrel.tsc.w2) {
      return next(new Error(`Barrel ${barrel.barrelNumber}: W1_TSC must be ≤ W2_TSC`));
    }
    
    // Recalculate DRC and TSC on backend
    barrel.drc.value = Number(((barrel.drc.w1 / barrel.drc.w2) * 100).toFixed(2));
    barrel.tsc.value = Number(((barrel.tsc.w1 / barrel.tsc.w2) * 100).toFixed(2));
    
    // Scientific validation: TSC >= DRC
    if (barrel.tsc.value < barrel.drc.value) {
      return next(new Error(`Barrel ${barrel.barrelNumber}: TSC cannot be less than DRC`));
    }
    
    // pH validation
    if (barrel.ph < 0 || barrel.ph > 14) {
      return next(new Error(`Barrel ${barrel.barrelNumber}: pH must be between 0 and 14`));
    }
  }
  
  next();
});

module.exports = mongoose.model('Sample', sampleSchema);
