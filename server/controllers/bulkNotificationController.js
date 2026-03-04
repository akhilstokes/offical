const Notification = require('../models/Notification');
const User = require('../models/userModel');

// Send notification to all staff
exports.sendToAllStaff = async (req, res) => {
  try {
    const { title, message, link } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }
    
    // Get all staff users (excluding admin and manager)
    const staff = await User.find({ 
      role: { $in: ['accountant', 'lab_staff', 'field_worker', 'delivery_staff', 'staff'] }
    }).select('_id role');
    
    console.log(`Found ${staff.length} staff members to notify`);
    
    if (staff.length === 0) {
      // Still return success but with a warning
      return res.json({ 
        success: true, 
        message: 'No staff members found in the system',
        count: 0,
        warning: 'No recipients available'
      });
    }
    
    // Create notifications for all staff
    const notifications = staff.map(user => ({
      userId: user._id,
      title,
      message,
      link: link || '/staff/dashboard',
      meta: {
        type: 'announcement',
        sentBy: req.user._id,
        sentByRole: req.user.role
      }
    }));
    
    await Notification.insertMany(notifications);
    
    console.log(`Successfully sent ${notifications.length} notifications`);
    
    return res.json({ 
      success: true, 
      message: `Notification sent to ${staff.length} staff members`,
      count: staff.length,
      recipientCount: staff.length
    });
  } catch (error) {
    console.error('Send to all staff error:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Send notification to specific role
exports.sendToRole = async (req, res) => {
  try {
    const { title, message, link, role } = req.body;
    
    if (!title || !message || !role) {
      return res.status(400).json({ message: 'Title, message, and role are required' });
    }
    
    // Get users with specific role
    const users = await User.find({ role }).select('_id role');
    
    console.log(`Found ${users.length} users with role: ${role}`);
    
    if (users.length === 0) {
      // Still return success but with a warning
      return res.json({ 
        success: true, 
        message: `No users found with role: ${role}`,
        count: 0,
        warning: 'No recipients available'
      });
    }
    
    // Create notifications for all users with this role
    const notifications = users.map(user => ({
      userId: user._id,
      title,
      message,
      link: link || `/${role}/dashboard`,
      meta: {
        type: 'announcement',
        targetRole: role,
        sentBy: req.user._id,
        sentByRole: req.user.role
      }
    }));
    
    await Notification.insertMany(notifications);
    
    console.log(`Successfully sent ${notifications.length} notifications to ${role}`);
    
    return res.json({ 
      success: true, 
      message: `Notification sent to ${users.length} ${role}(s)`,
      count: users.length,
      recipientCount: users.length
    });
  } catch (error) {
    console.error('Send to role error:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Send notification to specific users
exports.sendToUsers = async (req, res) => {
  try {
    const { title, message, link, userIds } = req.body;
    
    if (!title || !message || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Title, message, and userIds array are required' });
    }
    
    // Verify users exist
    const users = await User.find({ _id: { $in: userIds } }).select('_id role');
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }
    
    // Create notifications for specific users
    const notifications = users.map(user => ({
      userId: user._id,
      title,
      message,
      link: link || `/${user.role}/dashboard`,
      meta: {
        type: 'direct_message',
        sentBy: req.user._id,
        sentByRole: req.user.role
      }
    }));
    
    await Notification.insertMany(notifications);
    
    return res.json({ 
      success: true, 
      message: `Notification sent to ${users.length} user(s)`,
      count: users.length 
    });
  } catch (error) {
    console.error('Send to users error:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Send attendance reminder to role
exports.sendAttendanceReminder = async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }
    
    // Get users with specific role
    const users = await User.find({ role }).select('_id role');
    
    if (users.length === 0) {
      return res.status(404).json({ message: `No users found with role: ${role}` });
    }
    
    const roleNames = {
      accountant: 'Accountant',
      lab_staff: 'Lab Staff',
      field_worker: 'Field Worker',
      delivery_staff: 'Delivery Staff',
      staff: 'Staff'
    };
    
    const roleName = roleNames[role] || role;
    
    // Create attendance reminder notifications
    const notifications = users.map(user => ({
      userId: user._id,
      title: '⏰ Attendance Reminder',
      message: `Don't forget to mark your attendance today! Check-in window is open.`,
      link: `/${role}/attendance`,
      meta: {
        type: 'reminder',
        category: 'attendance',
        targetRole: role,
        sentBy: req.user._id,
        sentByRole: req.user.role
      }
    }));
    
    await Notification.insertMany(notifications);
    
    return res.json({ 
      success: true, 
      message: `Attendance reminder sent to ${users.length} ${roleName}(s)`,
      count: users.length 
    });
  } catch (error) {
    console.error('Send attendance reminder error:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Get notification statistics
exports.getNotificationStats = async (req, res) => {
  try {
    const totalSent = await Notification.countDocuments();
    const totalRead = await Notification.countDocuments({ read: true });
    const totalUnread = await Notification.countDocuments({ read: false });
    
    // Count by role
    const byRole = await User.aggregate([
      {
        $lookup: {
          from: 'notifications',
          localField: '_id',
          foreignField: 'userId',
          as: 'notifications'
        }
      },
      {
        $group: {
          _id: '$role',
          totalNotifications: { $sum: { $size: '$notifications' } },
          users: { $sum: 1 }
        }
      }
    ]);
    
    return res.json({
      success: true,
      stats: {
        totalSent,
        totalRead,
        totalUnread,
        readRate: totalSent > 0 ? ((totalRead / totalSent) * 100).toFixed(1) + '%' : '0%',
        byRole
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

