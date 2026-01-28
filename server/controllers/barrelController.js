 const Barrel = require('../models/barrelModel');
const { evaluateAndFlag } = require('../services/lumbDetectionService');
const User = require('../models/userModel');
const mongoose = require('mongoose');

// @desc    Add a new barrel to the system
// @route   POST /api/barrels
exports.addBarrel = async (req, res) => {
    try {
        let {
            barrelId,
            capacity,
            currentVolume = 0,
            status = 'in-storage',
            lastKnownLocation = '',
            notes = '',
            materialName = '',
            batchNo = '',
            manufactureDate,
            expiryDate,
            unit = 'L',
        } = req.body;

        // Basic validation and normalization
        barrelId = (barrelId || '').trim();
        materialName = (materialName || '').trim();
        batchNo = (batchNo || '').trim();
        lastKnownLocation = (lastKnownLocation || '').trim();
        unit = (unit || 'L').trim();
        if (!barrelId) {
            return res.status(400).json({ message: 'barrelId is required' });
        }
        const cap = Number(capacity);
        capacity = Number.isFinite(cap) && cap >= 1 ? cap : 1;

        const newBarrel = new Barrel({
            barrelId,
            capacity,
            currentVolume,
            status,
            lastKnownLocation,
            notes,
            materialName,
            batchNo,
            manufactureDate,
            expiryDate,
            unit,
            lastUpdatedBy: req.user?._id,
        });

        const savedBarrel = await newBarrel.save();
        return res.status(201).json(savedBarrel);
    } catch (error) {
        if (error && (error.code === 11000 || error.code === 11001)) {
            // Duplicate key error (unique index on barrelId)
            return res.status(409).json({ message: 'Barrel ID already exists' });
        }
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a barrel's status, location, and volume
// @route   PUT /api/barrels/:id
exports.updateBarrel = async (req, res) => {
    try {
        const { currentVolume, status, lastKnownLocation, materialName, batchNo, manufactureDate, expiryDate, unit, notes } = req.body;
        const barrel = await Barrel.findById(req.params.id);
        if(!barrel) {
            return res.status(404).json({ message: "Barrel not found" });
        }
        // Validate statuses and ownership
        if (barrel.status === 'disposed') {
            return res.status(400).json({ message: `Disposed barrels cannot be assigned: ${barrel.barrelId}` });
        }
        if (barrel.assignedTo && String(barrel.assignedTo) !== String(req.user._id)) {
            return res.status(409).json({ message: `Barrel already assigned: ${barrel.barrelId}` });
        }
        barrel.currentVolume = currentVolume;
        barrel.status = status;
        barrel.lastKnownLocation = lastKnownLocation;
        if (materialName !== undefined) barrel.materialName = materialName;
        if (batchNo !== undefined) barrel.batchNo = batchNo;
        if (manufactureDate !== undefined) barrel.manufactureDate = manufactureDate;
        if (expiryDate !== undefined) barrel.expiryDate = expiryDate;
        if (unit !== undefined) barrel.unit = unit;
        if (notes !== undefined) barrel.notes = notes;
        barrel.lastUpdatedBy = req.user._id;

        const updatedBarrel = await barrel.save();
        res.status(200).json(updatedBarrel);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    FEFO: Get next barrel to use (earliest expiry among in-storage/in-use with volume > 0)
// @route   GET /api/barrels/fefo/next
exports.getNextToUse = async (req, res) => {
    try {
        const next = await Barrel.find({
            status: { $in: ['in-storage', 'in-use'] },
            expiryDate: { $ne: null },
            currentVolume: { $gt: 0 },
        })
        .sort({ expiryDate: 1 })
        .limit(1);

        return res.json(next[0] || null);
    } catch (error) {
        console.error('assignBatch unexpected error:', error);
        return res.status(500).json({
            message: 'Assign failed due to an unexpected error',
            error: error.message,
            code: error.code || undefined,
            stack: (process.env.NODE_ENV !== 'production' && error.stack) ? error.stack : undefined,
        });
    }
};

// @desc    FEFO: Get upcoming expiry queue
// @route   GET /api/barrels/fefo/queue
exports.getExpiryQueue = async (req, res) => {
    try {
        const list = await Barrel.find({
            status: { $in: ['in-storage', 'in-use'] },
            expiryDate: { $ne: null },
            currentVolume: { $gt: 0 },
        })
        .sort({ expiryDate: 1 })
        .select('barrelId materialName lastKnownLocation expiryDate');

        return res.json(list);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    FEFO: Mark a barrel as in-use
// @route   POST /api/barrels/:id/mark-in-use
exports.markInUse = async (req, res) => {
    try {
        const userId = req.body.userId;
        const user = await User.findById(userId).select('_id name email role status');
        if (!user) return res.status(404).json({ message: 'Recipient user not found' });
        if (user.role !== 'user') {
            return res.status(400).json({ message: 'Recipient must be a valid customer user (role=user)' });
        }
        if (user.status !== 'active') {
            return res.status(400).json({ message: 'Recipient user is not active' });
        }
        const barrel = await Barrel.findById(req.params.id);
        if (!barrel) return res.status(404).json({ message: 'Barrel not found' });
        barrel.status = 'in-use';
        barrel.assignedTo = userId;
        barrel.lastUpdatedBy = req.user._id;
        const saved = await barrel.save();
        return res.json(saved);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all barrels
// @route   GET /api/barrels
exports.getAllBarrels = async (req, res) => {
    try {
        const barrels = await Barrel.find({}).populate('lastUpdatedBy', 'name');
        res.status(200).json(barrels);
    } catch (error) {
         res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Manager/Admin: assign multiple barrels to a user with optional dispatchDate
// @route   POST /api/barrels/assign-batch
exports.assignBatch = async (req, res) => {
    try {
        const { barrelIds, userId, note = '', dispatchDate } = req.body || {};
        // Validate array
        if (!Array.isArray(barrelIds) || barrelIds.length === 0) {
            return res.status(400).json({ message: 'barrelIds array is required' });
        }
        const uniqueIds = Array.from(new Set(barrelIds.map(v => String(v || '').trim()).filter(Boolean)));
        if (uniqueIds.length === 0) return res.status(400).json({ message: 'No valid barrelIds provided' });
        if (!userId) return res.status(400).json({ message: 'userId is required' });
    if (!mongoose.Types.ObjectId.isValid(String(userId))) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

        // Validate recipient
        const user = await User.findById(userId).select('_id name email role status');
        if (!user) return res.status(404).json({ message: 'Recipient user not found' });
        if (user.role !== 'user') return res.status(400).json({ message: 'Recipient must be a valid customer user (role=user)' });
        if (user.status !== 'active') return res.status(400).json({ message: 'Recipient user is not active' });

        // Load barrels and validate existence
        const barrels = await Barrel.find({ barrelId: { $in: uniqueIds } });
        if (barrels.length !== uniqueIds.length) {
            const foundSet = new Set(barrels.map(b => b.barrelId));
            const missing = uniqueIds.filter(id => !foundSet.has(id));
            return res.status(404).json({ message: `Barrels not found: ${missing.join(', ')}` });
        }

        // Disallow disposed and already-owned barrels (by different user)
        const disposed = barrels.filter(b => b.status === 'disposed');
        if (disposed.length) return res.status(400).json({ message: `Disposed barrels cannot be assigned: ${disposed.map(b=>b.barrelId).join(', ')}` });
        const alreadyAssigned = barrels.filter(b => b.assignedTo && String(b.assignedTo) !== String(user._id));
        if (alreadyAssigned.length) return res.status(409).json({ message: `Some barrels already assigned: ${alreadyAssigned.map(b=>b.barrelId).join(', ')}` });

        // Update barrels
        let when = new Date();
    if (dispatchDate) {
      const dt = new Date(dispatchDate);
      if (!isNaN(dt.getTime())) when = dt; else return res.status(400).json({ message: 'Invalid dispatchDate' });
    }
        const updaterId = (req.user && req.user._id && mongoose.Types.ObjectId.isValid(String(req.user._id))) ? req.user._id : null;
        for (const b of barrels) {
            if (!b || !b._id) {
                return res.status(500).json({ message: 'Loaded an invalid barrel document', details: { ids: uniqueIds } });
            }
            b.assignedTo = user._id;
            b.lastKnownLocation = 'dispatched';
            if (updaterId) b.lastUpdatedBy = updaterId;
        }
        try {
            await Promise.all(barrels.map(b => b.save()));
        } catch (saveErr) {
            console.error('assignBatch barrel save error:', saveErr);
            return res.status(500).json({ message: 'Failed to update barrel assignments', error: saveErr.message });
        }

        // Movement logs (best-effort, do not fail assignment if logging fails)
        const BarrelMovement = require('../models/barrelMovementModel');
        let movementErrors = 0;
        await Promise.all(barrels.map(async (b) => {
            try {
                await BarrelMovement.create({
                    barrel: b._id,
                    type: 'out',
                    movementKind: 'dispatch',
                    recipientUser: user._id,
                    dispatchDate: when,
                    fromLocation: b.currentLocation || 'factory',
                    toLocation: 'user',
                    notes: note,
                    dispatchNote: note,
                    createdBy: updaterId || undefined,
                });
            } catch (e) {
                movementErrors += 1;
            }
        }));

        return res.json({
            success: true,
            assignedTo: { id: String(user._id), name: user.name || user.email },
            count: barrels.length,
            barrelIds: barrels.map(b => b.barrelId),
            note,
            dispatchDate: when,
            movementLogged: movementErrors === 0,
            movementErrors,
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    List barrels assigned to current user
// @route   GET /api/barrels/my-assigned
exports.listMyAssigned = async (req, res) => {
    try {
        const myId = req.user?._id;
        // Only return barrels that are 'in-use' (available to the user)
        // Exclude 'pending_sale' and 'sold' barrels
        const items = await Barrel.find({ 
            assignedTo: myId,
            status: 'in-use' // Only count available barrels
        }).sort({ assignedDate: 1 }); // Sort by oldest first (FIFO)
        
        return res.json({ 
            records: items, 
            count: items.length,
            message: `User has ${items.length} barrel(s) available`
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Manager/Admin: list recent barrel dispatch allocations
// @route   GET /api/barrels/dispatch-history?barrelId=&userId=&limit=50
exports.listDispatchHistory = async (req, res) => {
    try {
        const { barrelId, userId, limit = 50 } = req.query || {};
        const BarrelMovement = require('../models/barrelMovementModel');
        const BarrelModel = require('../models/barrelModel');
        const q = { movementKind: 'dispatch' };
        if (userId) q.recipientUser = userId;
        if (barrelId) {
            const b = await BarrelModel.findOne({ barrelId: String(barrelId) }).select('_id');
            if (!b) return res.json({ records: [], count: 0 });
            q.barrel = b._id;
        }
        const lim = Math.min(200, Math.max(1, Number(limit) || 50));
        const rows = await BarrelMovement.find(q)
            .sort({ createdAt: -1 })
            .limit(lim)
            .populate('recipientUser', 'name email')
            .populate('barrel', 'barrelId');
        return res.json({
            count: rows.length,
            records: rows.map(r => ({
                id: r._id,
                barrelId: r.barrel?.barrelId || '',
                recipient: r.recipientUser?.name || r.recipientUser?.email || '',
                dispatchDate: r.dispatchDate || r.createdAt,
                note: r.dispatchNote || r.notes || ''
            }))
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update base/empty weight; compute lumb% and flag if needed (Lab)
// @route   PUT /api/barrels/:id/weights
exports.updateWeights = async (req, res) => {
    try {
        const { baseWeight, emptyWeight } = req.body;
        const barrel = await Barrel.findById(req.params.id);
        if (!barrel) return res.status(404).json({ message: 'Barrel not found' });
        if (typeof baseWeight === 'number') barrel.baseWeight = baseWeight;
        if (typeof emptyWeight === 'number') barrel.emptyWeight = emptyWeight;

        await evaluateAndFlag(barrel, { userId: req.user._id, threshold: 20 });
        barrel.lastUpdatedBy = req.user._id;
        const saved = await barrel.save();
        return res.json(saved);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update current location (Field/Lab)
// @route   PUT /api/barrels/:id/location
exports.setLocation = async (req, res) => {
    try {
        const { currentLocation, lastKnownLocation } = req.body;
        const barrel = await Barrel.findById(req.params.id);
        if (!barrel) return res.status(404).json({ message: 'Barrel not found' });
        if (currentLocation) barrel.currentLocation = currentLocation;
        if (lastKnownLocation) barrel.lastKnownLocation = lastKnownLocation;
        barrel.lastUpdatedBy = req.user._id;
        const saved = await barrel.save();
        return res.json(saved);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update condition (Manager/Admin)
// @route   PUT /api/barrels/:id/condition
exports.setCondition = async (req, res) => {
    try {
        const { condition, damageType } = req.body;
        const barrel = await Barrel.findById(req.params.id);
        if (!barrel) return res.status(404).json({ message: 'Barrel not found' });
        if (condition) barrel.condition = condition;
        if (damageType) barrel.damageType = damageType;
        barrel.lastUpdatedBy = req.user._id;
        const saved = await barrel.save();
        return res.json(saved);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};