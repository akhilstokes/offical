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
