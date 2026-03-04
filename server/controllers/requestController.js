const BarrelRequest = require('../models/barrelRequestModel');
const IssueReport = require('../models/issueReportModel');

// Barrel Requests
exports.createBarrelRequest = async (req, res) => {
  try {
    const { quantity, notes = '' } = req.body;
    if (!quantity || Number(quantity) < 1) return res.status(400).json({ message: 'quantity is required' });
    const doc = await BarrelRequest.create({ user: req.user._id, quantity: Number(quantity), notes });
    return res.status(201).json(doc);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.listMyBarrelRequests = async (req, res) => {
  try {
    const list = await BarrelRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json(list);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Manager: List all barrel requests
exports.listAllBarrelRequests = async (req, res) => {
  try {
    const list = await BarrelRequest.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    return res.json(list);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Manager: Approve barrel request
exports.approveBarrelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await BarrelRequest.findByIdAndUpdate(
      id,
      { 
        status: 'APPROVED', 
        adminNotes: req.body.notes || 'Approved by manager',
        approvedAt: new Date(),
        approvedBy: req.user?._id || req.user?.id
      },
      { new: true }
    ).populate('user', 'name email phone');
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    
    console.log('Barrel request approved:', { id, status: doc.status });
    return res.json(doc);
  } catch (e) {
    console.error('Error approving barrel request:', e);
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Manager: Reject barrel request
exports.rejectBarrelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const doc = await BarrelRequest.findByIdAndUpdate(
      id,
      { status: 'rejected', adminNotes: reason || 'Rejected by manager' },
      { new: true }
    ).populate('user', 'name email');
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    return res.json(doc);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Manager: Assign delivery staff to barrel request
exports.assignBarrelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryStaffId } = req.body;
    
    if (!deliveryStaffId) {
      return res.status(400).json({ message: 'deliveryStaffId is required' });
    }
    
    const doc = await BarrelRequest.findByIdAndUpdate(
      id,
      { 
        status: 'ASSIGNED',
        assignedDeliveryStaffId: deliveryStaffId,
        assignedAt: new Date(),
        assignedBy: req.user?._id || req.user?.id
      },
      { new: true }
    ).populate('user', 'name email phone')
     .populate('assignedDeliveryStaffId', 'name email phone');
    
    if (!doc) return res.status(404).json({ message: 'Request not found' });
    
    console.log('Barrel request assigned:', { id, deliveryStaffId, status: doc.status });
    return res.json(doc);
  } catch (e) {
    console.error('Error assigning barrel request:', e);
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Issue Reports
exports.createIssueReport = async (req, res) => {
  try {
    const { category = 'other', title, description = '' } = req.body;
    if (!title) return res.status(400).json({ message: 'title is required' });
    const doc = await IssueReport.create({ user: req.user._id, category, title, description });
    return res.status(201).json(doc);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.listMyIssues = async (req, res) => {
  try {
    const list = await IssueReport.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.json(list);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};


