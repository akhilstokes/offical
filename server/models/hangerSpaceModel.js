const mongoose = require('mongoose');

const VALID_BLOCKS = ['A', 'B'];
const VALID_ROWS = ['D','E','F','G','H','I','J','K','L'];

const HangerSpaceSchema = new mongoose.Schema({
  block: { type: String, enum: VALID_BLOCKS, required: true },
  row: { type: String, enum: VALID_ROWS, required: true },
  col: { type: Number, min: 1, max: 10, required: true },
  status: { type: String, enum: ['vacant', 'occupied', 'empty_barrel', 'complete_bill'], default: 'vacant', index: true },
  product: { type: String, default: '' }, // optional product/label for the occupied slot
  updatedBy: { type: String }, // store user id or 'builtin-admin' without requiring ObjectId
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

HangerSpaceSchema.index({ block: 1, row: 1, col: 1 }, { unique: true });

// Prevent model overwrite error
module.exports = mongoose.models.HangerSpace || mongoose.model('HangerSpace', HangerSpaceSchema);