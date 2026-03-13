const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

router.use(protect);

// POST /api/notifications - Create a new notification (for accountants/admins)
router.post('/', async (req, res) => {
  try {
    const { userId, role, title, message, link, meta } = req.body;
    
    // Only allow accountants and admins to create notifications for others
    if (!['accountant', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to create notifications' });
    }
    
    const notification = await Notification.create({
      userId,
      role: role || 'staff',
      title,
      message,
      link,
      meta
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'Notification sent successfully',
      notification 
    });
  } catch (e) {
    console.error('Error creating notification:', e);
    res.status(500).json({ message: 'Failed to create notification' });
  }
});

// POST /api/notifications/broadcast - Send notification to all users of a role
router.post('/broadcast', async (req, res) => {
  try {
    const { targetRole, title, message, priority } = req.body;
    
    // Only allow admins to broadcast notifications
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to broadcast notifications' });
    }
    
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }
    
    // Get all users of the target role
    const User = require('../models/userModel');
    let users = [];
    
    try {
      if (targetRole === 'all') {
        users = await User.find({}, '_id role');
      } else {
        users = await User.find({ role: targetRole }, '_id role');
      }
      
      console.log(`Found ${users.length} users with role: ${targetRole}`);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return res.status(500).json({ message: 'Database error while fetching users' });
    }
    
    if (users.length === 0) {
      return res.status(200).json({ 
        success: true,
        message: `No users found with role: ${targetRole}`,
        count: 0
      });
    }
    
    // Create notifications for all users
    const notifications = users.map(user => ({
      userId: user._id,
      role: targetRole === 'all' ? (user.role || 'user') : targetRole,
      title,
      message,
      priority: priority || 'normal',
      meta: { broadcast: true }
    }));
    
    try {
      await Notification.insertMany(notifications);
      console.log(`Successfully created ${notifications.length} notifications`);
    } catch (insertError) {
      console.error('Error inserting notifications:', insertError);
      return res.status(500).json({ message: 'Failed to create notifications' });
    }
    
    res.status(201).json({ 
      success: true, 
      message: `Notification sent to ${users.length} user(s)`,
      count: users.length
    });
  } catch (e) {
    console.error('Error broadcasting notification:', e);
    console.error('Error stack:', e.stack);
    res.status(500).json({ 
      message: 'Failed to broadcast notification',
      error: e.message 
    });
  }
});

// POST /api/notifications/staff-trip-event - Send notification to all users of a role (staff events)
router.post('/staff-trip-event', async (req, res) => {
  try {
    const { targetRole, title, message, link, meta } = req.body;
    
    if (!title || !message || !targetRole) {
      return res.status(400).json({ message: 'Title, message and targetRole are required' });
    }
    
    // Get all users of the target role
    const User = require('../models/userModel');
    let users = [];
    
    try {
      if (targetRole === 'all') {
        users = await User.find({ status: 'active' }, '_id role');
      } else {
        users = await User.find({ role: targetRole, status: 'active' }, '_id role');
      }
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return res.status(500).json({ message: 'Database error while fetching users' });
    }
    
    if (users.length === 0) {
      return res.status(200).json({ 
        success: true,
        message: `No active users found with role: ${targetRole}`,
        count: 0
      });
    }
    
    // Create notifications for all users
    const notifications = users.map(user => ({
      userId: user._id,
      role: targetRole === 'all' ? (user.role || 'user') : targetRole,
      title,
      message,
      link: link || '/lab/dashboard',
      meta: { ...meta, event: 'staff_trip' }
    }));
    
    try {
      await Notification.insertMany(notifications);
      console.log(`Successfully created ${notifications.length} staff event notifications for ${targetRole}`);
    } catch (insertError) {
      console.error('Error inserting notifications:', insertError);
      return res.status(500).json({ message: 'Failed to create notifications' });
    }
    
    res.status(201).json({ 
      success: true, 
      message: `Notification sent to ${users.length} ${targetRole}(s)`,
      count: users.length
    });
  } catch (e) {
    console.error('Error in staff-trip-event:', e);
    res.status(500).json({ 
      message: 'Failed to send event notification',
      error: e.message 
    });
  }
});

// GET /api/notifications?limit=20
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const docs = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit);
    const unread = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ notifications: docs, unread });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { read: true } },
      { new: true }
    );
    if (!n) return res.status(404).json({ message: 'Notification not found' });
    res.json({ notification: n });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

// Compatibility: some clients send PUT instead of PATCH
router.put('/:id/read', async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { read: true } },
      { new: true }
    );
    if (!n) return res.status(404).json({ message: 'Notification not found' });
    res.json({ notification: n });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

// Mark all read (compatibility for NotificationSystem.js)
router.put('/mark-all-read', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: 'Failed to mark all as read' });
  }
});

// POST /api/notifications/clear - Clear all notifications
router.post('/clear', async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.json({ ok: true, message: 'All notifications cleared' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to clear notifications' });
  }
});

module.exports = router;
