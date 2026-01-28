const mongoose = require('mongoose');
const SellRequest = require('../models/sellRequestModel');
const User = require('../models/userModel');

// Helper to resolve a usable ObjectId for authenticated user
async function resolveUserId(authUser) {
  try {
    if (authUser?._id && mongoose.isValidObjectId(authUser._id)) return new mongoose.Types.ObjectId(authUser._id);
    if (authUser?.id && mongoose.isValidObjectId(authUser.id)) return new mongoose.Types.ObjectId(authUser.id);
    if (authUser?.userId && mongoose.isValidObjectId(authUser.userId)) return new mongoose.Types.ObjectId(authUser.userId);
    if (authUser?.staffId) {
      const userDoc = await User.findOne({ staffId: authUser.staffId }).select('_id');
      if (userDoc?._id) return userDoc._id;
    }
    if (authUser?.email) {
      const userDoc = await User.findOne({ email: authUser.email }).select('_id');
      if (userDoc?._id) return userDoc._id;
    }
    return null;
  } catch (_) { return null; }
}

// Farmer: create sell request
exports.createSellRequest = async (req, res) => {
  try {
    const { totalVolumeKg, notes, location, locationAccuracy, capturedAddress } = req.body || {};
    const userId = await resolveUserId(req.user);
    if (!userId) return res.status(400).json({ message: 'Invalid authenticated user' });
    if (!totalVolumeKg || Number(totalVolumeKg) <= 0) return res.status(400).json({ message: 'totalVolumeKg must be > 0' });

    const payload = {
      farmerId: userId,
      createdBy: userId,
      status: 'REQUESTED',
      totalVolumeKg: Number(totalVolumeKg),
      requestedAt: new Date(),
      amount: 0
    };
    if (location && location.type === 'Point' && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      payload.location = { type: 'Point', coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])] };
    }
    if (locationAccuracy !== undefined) payload.locationAccuracy = Number(locationAccuracy);
    if (capturedAddress) payload.capturedAddress = String(capturedAddress);

    const doc = await SellRequest.create(payload);
    return res.status(201).json({ success: true, request: doc });
  } catch (e) {
    console.error('createSellRequest error:', e);
    return res.status(500).json({ message: 'Failed to create request' });
  }
};

// Farmer: list my sell requests
exports.listMySellRequests = async (req, res) => {
  try {
    const userId = await resolveUserId(req.user);
    if (!userId) return res.json([]);
    const items = await SellRequest.find({ farmerId: userId }).sort({ createdAt: -1 }).lean();
    return res.json(items);
  } catch (e) {
    console.error('listMySellRequests error:', e);
    return res.status(500).json({ message: 'Failed to load requests' });
  }
};

// Delivery Staff: list my assigned sell requests
exports.listAssignedForDelivery = async (req, res) => {
  try {
    const userId = await resolveUserId(req.user);
    if (!userId) return res.json([]);
    const items = await SellRequest.find({
      assignedDeliveryStaffId: userId,
      status: { $in: ['DELIVER_ASSIGNED', 'COLLECTED'] }
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(100)
      .populate('farmerId', 'name email phoneNumber address')
      .lean();
    return res.json({ records: items });
  } catch (e) {
    console.error('listAssignedForDelivery error:', e);
    return res.status(500).json({ message: 'Failed to load assignments' });
  }
};

// Manager: assign field staff
exports.assignFieldStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { fieldStaffId } = req.body || {};
    if (!fieldStaffId || !mongoose.isValidObjectId(fieldStaffId)) return res.status(400).json({ message: 'Valid fieldStaffId required' });
    const doc = await SellRequest.findById(id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    doc.assignedFieldStaffId = fieldStaffId;
    if (['REQUESTED', 'FIELD_ASSIGNED'].includes(doc.status)) doc.status = 'FIELD_ASSIGNED';
    if (['REQUESTED','FIELD_ASSIGNED'].includes(doc.status)) doc.status = 'FIELD_ASSIGNED';
    await doc.save();
    return res.json({ success: true, request: doc });
  } catch (e) {
    console.error('assignFieldStaff error:', e);
    return res.status(500).json({ message: 'Failed to assign field staff' });
  }
};

// Manager: assign delivery staff
exports.assignDeliveryStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryStaffId } = req.body || {};
    if (!deliveryStaffId || !mongoose.isValidObjectId(deliveryStaffId)) return res.status(400).json({ message: 'Valid deliveryStaffId required' });
    const doc = await SellRequest.findById(id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    doc.assignedDeliveryStaffId = deliveryStaffId;
    if (['COLLECTED', 'DELIVER_ASSIGNED'].includes(doc.status)) doc.status = 'DELIVER_ASSIGNED';
    if (['COLLECTED','DELIVER_ASSIGNED'].includes(doc.status)) doc.status = 'DELIVER_ASSIGNED';
    await doc.save();
    return res.json({ success: true, request: doc });
  } catch (e) {
    console.error('assignDeliveryStaff error:', e);
    return res.status(500).json({ message: 'Failed to assign delivery staff' });
  }
};

// Field Staff: mark collected (with barrels summary)
exports.markCollected = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalVolumeKg, damaged, notes } = req.body || {};
    const staffId = await resolveUserId(req.user);
    if (!staffId) return res.status(400).json({ message: 'Invalid user' });
    const doc = await SellRequest.findById(id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    doc.collectedAt = new Date();
    if (totalVolumeKg) doc.totalVolumeKg = Number(totalVolumeKg);
    if (notes) doc.collectionNotes = notes;
    if (damaged === true) doc.collectionDamageReported = true;
    doc.status = 'COLLECTED';
    await doc.save();
    return res.json({ success: true, request: doc });
  } catch (e) {
    console.error('markCollected error:', e);
    return res.status(500).json({ message: 'Failed to mark collected' });
  }
};

// Delivery Staff: delivered to lab
exports.markDeliveredToLab = async (req, res) => {
  try {
    const { id } = req.params;
    // Validate id format
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid request id' });
    }

    // Load document
    const doc = await SellRequest.findById(id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });

    // Prevent duplicate/invalid transitions
    if (doc.status === 'DELIVERED_TO_LAB' || doc.status === 'TESTED' || doc.status === 'ACCOUNT_CALCULATED' || doc.status === 'VERIFIED') {
      return res.status(409).json({ message: 'Request already delivered to lab or beyond' });
    }

    // Ensure only assigned delivery staff can perform this
    const userId = await resolveUserId(req.user);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!doc.assignedDeliveryStaffId || String(doc.assignedDeliveryStaffId) !== String(userId)) {
      return res.status(403).json({ message: 'Not assigned to you' });
    }

    // Enforce allowed current statuses
    if (!['DELIVER_ASSIGNED', 'COLLECTED'].includes(doc.status)) {
      return res.status(400).json({ message: `Invalid status transition from ${doc.status}` });
    }

    // Update
    doc.deliveredAt = new Date();
    doc.status = 'DELIVERED_TO_LAB';
    await doc.save();
    return res.json({ success: true, request: doc });
  } catch (e) {
    console.error('markDeliveredToLab error:', e);
    return res.status(500).json({ message: 'Failed to update status' });
  }
};

// Lab: record DRC test
exports.recordDrcTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { drcPct } = req.body || {};
    if (drcPct === undefined || drcPct === null) return res.status(400).json({ message: 'drcPct is required' });
    const doc = await SellRequest.findById(id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    doc.drcPct = Number(drcPct);
    doc.testedAt = new Date();
    doc.status = 'TESTED';
    await doc.save();
    return res.json({ success: true, request: doc });
  } catch (e) {
    console.error('recordDrcTest error:', e);
    return res.status(500).json({ message: 'Failed to save test' });
  }
};

// Lab: finalize details and submit to Accounts
exports.submitForAccounts = async (req, res) => {
  try {
    const { id } = req.params;
    const { farmerName, drcPct, barrelCount } = req.body || {};
    const doc = await SellRequest.findById(id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    if (farmerName !== undefined) doc.overrideFarmerName = String(farmerName).trim();
    if (drcPct !== undefined) doc.drcPct = Number(drcPct);
    if (barrelCount !== undefined) doc.barrelCount = Number(barrelCount);
    if (!doc.testedAt && doc.drcPct != null) doc.testedAt = new Date();
    if (!doc.status || doc.status === 'DELIVERED_TO_LAB') doc.status = 'TESTED';
    await doc.save();
    return res.json({ success: true, request: doc });
  } catch (e) {
    console.error('submitForAccounts error:', e);
    return res.status(500).json({ message: 'Failed to submit for accounts' });
  }
};

// Accountant: calculate amount
exports.accountantCalculate = async (req, res) => {
  try {
    const { id } = req.params;
    const { marketRate } = req.body || {};
    if (marketRate === undefined || marketRate === null) return res.status(400).json({ message: 'marketRate is required' });
    const doc = await SellRequest.findById(id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    const dryKg = Number(doc.totalVolumeKg || 0) * (Number(doc.drcPct || 0) / 100);
    const amount = Math.round(dryKg * Number(marketRate));
    doc.marketRate = Number(marketRate);
    doc.amount = amount;
    doc.calculatedAt = new Date();
    doc.status = 'ACCOUNT_CALCULATED';
    await doc.save();
    return res.json({ success: true, request: doc, calc: { dryKg, marketRate: Number(marketRate), amount } });
  } catch (e) {
    console.error('accountantCalculate error:', e);
    return res.status(500).json({ message: 'Failed to calculate' });
  }
};

// Manager: verify
exports.managerVerify = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await SellRequest.findById(id).populate('farmerId', 'name email address');
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    if (!doc.amount || !doc.marketRate) return res.status(400).json({ message: 'Calculation not completed yet' });
    doc.verifiedAt = new Date();
    doc.status = 'VERIFIED';
    doc.invoiceNumber = `INV-${String(doc._id).slice(-8).toUpperCase()}`;
    doc.invoicePdfUrl = `/api/sell-requests/${doc._id}/invoice`;
    await doc.save();
    return res.json({ success: true, request: doc });
  } catch (e) {
    console.error('managerVerify error:', e);
    return res.status(500).json({ message: 'Failed to verify' });
  }
};

// Invoice JSON (placeholder)
exports.getInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await SellRequest.findById(id).populate('farmerId', 'name email phoneNumber address');
    if (!doc) return res.status(404).json({ message: 'Invoice not found' });
    if (doc.status !== 'VERIFIED') return res.status(400).json({ message: 'Invoice available only after verification' });
    const dryKg = Number(doc.totalVolumeKg || 0) * (Number(doc.drcPct || 0) / 100);
    const invoice = {
      number: doc.invoiceNumber,
      date: doc.verifiedAt || doc.updatedAt,
      buyer: { name: doc.farmerId?.name, email: doc.farmerId?.email, phone: doc.farmerId?.phoneNumber },
      request: { volumeKg: doc.totalVolumeKg, drcPercent: doc.drcPct, marketRate: doc.marketRate, dryKg },
      amount: doc.amount,
      company: { name: 'Holy Family Polymers' }
    };
    return res.json({ success: true, invoice });
  } catch (e) {
    console.error('getInvoice error:', e);
    return res.status(500).json({ message: 'Failed to load invoice' });
  }
};

// Admin/Manager: list all sell requests with optional status filter and pagination
exports.listAllSellRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query || {};
    const q = {};
    if (status) q.status = status;
    const items = await SellRequest.find(q)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('farmerId', 'name email address')
      .populate('assignedDeliveryStaffId', 'name email')
      .lean();
    const total = await SellRequest.countDocuments(q);
    return res.json({ records: items, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (e) {
    console.error('listAllSellRequests error:', e);
    return res.status(500).json({ message: 'Failed to load' });
  }
};

// Lab: list sell requests pending at lab (delivered but not yet tested)
exports.listLabPendingSellRequests = async (req, res) => {
  try {
    const items = await SellRequest.find({ status: 'DELIVERED_TO_LAB' })
      .sort({ deliveredAt: -1 })
      .populate('farmerId', 'name email address')
      .lean();
    return res.json(items);
  } catch (e) {
    console.error('listLabPendingSellRequests error:', e);
    return res.status(500).json({ message: 'Failed to load lab pending requests' });
  }
};

// Admin: create sell request (on behalf of farmer or self)
exports.createSellRequestAdmin = async (req, res) => {
  try {
    const { farmerId, totalVolumeKg, notes, location, locationAccuracy, capturedAddress } = req.body || {};

    // If farmerId is provided, use it, otherwise try to resolve from authenticated user
    let targetUserId = farmerId;
    if (!targetUserId) {
      targetUserId = await resolveUserId(req.user);
    }

    if (!targetUserId || !mongoose.isValidObjectId(targetUserId)) {
      return res.status(400).json({ message: 'Valid farmerId or authenticated user required' });
    }

    if (!totalVolumeKg || Number(totalVolumeKg) <= 0) return res.status(400).json({ message: 'totalVolumeKg must be > 0' });

    const payload = {
      farmerId: targetUserId,
      createdBy: await resolveUserId(req.user), // Created by the admin/staff
      status: 'REQUESTED',
      totalVolumeKg: Number(totalVolumeKg),
      requestedAt: new Date(),
      amount: 0,
      notes: notes
    };

    if (location && location.type === 'Point' && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      payload.location = { type: 'Point', coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])] };
    }
    if (locationAccuracy !== undefined) payload.locationAccuracy = Number(locationAccuracy);
    if (capturedAddress) payload.capturedAddress = String(capturedAddress);

    const doc = await SellRequest.create(payload);
    return res.status(201).json({ success: true, request: doc });
  } catch (e) {
    console.error('createSellRequestAdmin error:', e);
    return res.status(500).json({ message: 'Failed to create request' });
  }
};

// Admin: update sell request
exports.updateSellRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const doc = await SellRequest.findById(id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });

    // Allow updating specific fields
    if (updates.totalVolumeKg !== undefined) doc.totalVolumeKg = Number(updates.totalVolumeKg);
    if (updates.status !== undefined) doc.status = updates.status;
    if (updates.notes !== undefined) doc.notes = updates.notes;
    if (updates.drcPct !== undefined) doc.drcPct = Number(updates.drcPct);
    if (updates.marketRate !== undefined) doc.marketRate = Number(updates.marketRate);
    if (updates.amount !== undefined) doc.amount = Number(updates.amount);

    // Recalculate if necessary (simple logic, might need more robust handling depending on business rules)
    if (doc.drcPct && doc.marketRate && doc.totalVolumeKg) {
      const dryKg = Number(doc.totalVolumeKg) * (Number(doc.drcPct) / 100);
      doc.amount = Math.round(dryKg * Number(doc.marketRate));
    }

    await doc.save();
    return res.json({ success: true, request: doc });
  } catch (e) {
    console.error('updateSellRequest error:', e);
    return res.status(500).json({ message: 'Failed to update request' });
  }
};

// Admin: delete sell request
exports.deleteSellRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await SellRequest.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    return res.json({ success: true, message: 'Request deleted' });
  } catch (e) {
    console.error('deleteSellRequest error:', e);
    return res.status(500).json({ message: 'Failed to delete request' });
  }
};
