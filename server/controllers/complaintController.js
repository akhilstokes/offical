const Complaint = require('../models/complaintModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');

// Helper function to resolve staff ObjectId
async function resolveStaffObjectId(authUser) {
  try {
    // Handle built-in tokens that have string IDs
    if (authUser?._id && typeof authUser._id === 'string' && authUser._id.startsWith('builtin-')) {
      if (authUser.staffId) {
        const userDoc = await User.findOne({ staffId: authUser.staffId }).select('_id');
        if (userDoc?._id) return userDoc._id;
      }
      return null;
    }
    
    if (authUser?._id && mongoose.isValidObjectId(authUser._id)) {
      return new mongoose.Types.ObjectId(authUser._id);
    }
    if (authUser?.id && mongoose.isValidObjectId(authUser.id)) {
      return new mongoose.Types.ObjectId(authUser.id);
    }
    if (authUser?.userId && mongoose.isValidObjectId(authUser.userId)) {
      return new mongoose.Types.ObjectId(authUser.userId);
    }
    if (authUser?.staffId) {
      const userDoc = await User.findOne({ staffId: authUser.staffId }).select('_id');
      if (userDoc?._id) return userDoc._id;
    }
    return null;
  } catch (_) { 
    return null; 
  }
}

// Create a new complaint
exports.createComplaint = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      location,
      department
    } = req.body;

    const staffId = await resolveStaffObjectId(req.user);
    if (!staffId) {
      return res.status(400).json({ message: 'Invalid authenticated user. Unable to resolve staff id.' });
    }

    // Get user details
    const user = await User.findById(staffId).select('name role');
    if (!user) {
      return res.status(400).json({ message: 'User not found.' });
    }

    const complaint = new Complaint({
      title,
      description,
      category: category || 'other',
      priority: priority || 'medium',
      location,
      department,
      reportedBy: staffId,
      reportedByName: user.name,
      reportedByRole: user.role
    });

    await complaint.save();
    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get all complaints (for managers/admins)
exports.getAllComplaints = async (req, res) => {
  try {
    const { status, priority, category, assignedTo, page = 1, limit = 50 } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo;

    const skip = (page - 1) * limit;
    
    // Try without populate first to avoid errors
    let complaints;
    try {
      complaints = await Complaint.find(filter)
        .populate('reportedBy', 'name email role')
        .populate('assignedTo', 'name email role')
        .populate('resolvedBy', 'name email role')
        .sort({ reportedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
    } catch (populateError) {
      console.warn('Populate failed, fetching without populate:', populateError.message);
      // Fallback: fetch without populate
      complaints = await Complaint.find(filter)
        .sort({ reportedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
    }

    const total = await Complaint.countDocuments(filter);

    res.status(200).json({
      complaints,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error in getAllComplaints:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get complaints by user
exports.getMyComplaints = async (req, res) => {
  try {
    const staffId = await resolveStaffObjectId(req.user);
    if (!staffId) {
      return res.status(200).json([]);
    }

    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { reportedBy: staffId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    
    const complaints = await Complaint.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('resolvedBy', 'name email role')
      .sort({ reportedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Complaint.countDocuments(filter);

    res.status(200).json({
      complaints,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get single complaint
exports.getComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    
    const complaint = await Complaint.findById(id)
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('resolvedBy', 'name email role')
      .populate('internalNotes.addedBy', 'name email role');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.status(200).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Update complaint (for managers/admins)
exports.updateComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      priority,
      assignedTo,
      resolution,
      resolutionNotes,
      internalNotes
    } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Update fields
    if (status) {
      complaint.status = status;
      if (status === 'resolved') {
        complaint.resolvedAt = new Date();
        complaint.resolvedBy = req.user._id;
        const user = await User.findById(req.user._id).select('name');
        if (user) complaint.resolvedByName = user.name;
      } else if (status === 'closed') {
        complaint.closedAt = new Date();
      }
    }
    
    if (priority) complaint.priority = priority;
    if (assignedTo) {
      complaint.assignedTo = assignedTo;
      complaint.assignedAt = new Date();
      const user = await User.findById(assignedTo).select('name role');
      if (user) {
        complaint.assignedToName = user.name;
        complaint.assignedToRole = user.role;
      }
    }
    if (resolution) complaint.resolution = resolution;
    if (resolutionNotes) complaint.resolutionNotes = resolutionNotes;
    
    if (internalNotes) {
      complaint.internalNotes.push({
        note: internalNotes,
        addedBy: req.user._id,
        addedByName: req.user.name || 'Unknown',
        addedAt: new Date()
      });
    }

    await complaint.save();
    res.status(200).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Add feedback to resolved complaint
exports.addFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, rating } = req.body;

    const staffId = await resolveStaffObjectId(req.user);
    if (!staffId) {
      return res.status(400).json({ message: 'Invalid authenticated user.' });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check if user is the one who reported the complaint
    if (complaint.reportedBy.toString() !== staffId.toString()) {
      return res.status(403).json({ message: 'You can only provide feedback for your own complaints' });
    }

    if (complaint.status !== 'resolved') {
      return res.status(400).json({ message: 'Can only provide feedback for resolved complaints' });
    }

    complaint.feedback = feedback;
    if (rating) complaint.rating = rating;

    await complaint.save();
    res.status(200).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get complaint statistics
exports.getComplaintStats = async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } }
        }
      }
    ]);

    const categoryStats = await Complaint.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      overall: stats[0] || {
        total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0,
        urgent: 0, high: 0, medium: 0, low: 0
      },
      byCategory: categoryStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};




