const DeliveryTask = require('../models/deliveryTaskModel');
const DeliveryIntake = require('../models/deliveryIntakeModel');
const Notification = require('../models/Notification');
const User = require('../models/userModel');
const StaffLocation = require('../models/StaffLocation');
const Shift = require('../models/shiftModel');

// Create a delivery task (admin/manager)
exports.createTask = async (req, res) => {
  try {
    const { title, customerUserId, assignedTo, pickupAddress, dropAddress, scheduledAt, notes, meta } = req.body;
    if (!title || !assignedTo || !pickupAddress || !dropAddress) {
      return res.status(400).json({ message: 'title, assignedTo, pickupAddress and dropAddress are required' });
    }
    const doc = await DeliveryTask.create({ title, customerUserId, assignedTo, pickupAddress, dropAddress, scheduledAt, notes, meta });

    // Notify customer about schedule
    if (customerUserId) {
      await Notification.create({
        userId: customerUserId,
        role: 'user',
        title: 'Pickup Scheduled',
        message: `Pickup scheduled: ${title}`,
        link: '/user/notifications',
        meta: { taskId: doc._id, scheduledAt }
      });
    }

    return res.status(201).json(doc);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// List all tasks (admin/manager)
exports.listAllTasks = async (req, res) => {
  try {
    const { status, assignedTo, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;

    const tasks = await DeliveryTask.find(query)
      .populate('customerUserId', 'name email phoneNumber')
      .populate('assignedTo', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await DeliveryTask.countDocuments(query);

    return res.json({ items: tasks, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// List my tasks (delivery staff)
exports.listMyTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const tasks = await DeliveryTask.find({ assignedTo: userId })
      .populate('customerUserId', 'name email phoneNumber')
      .sort({ createdAt: -1 });

    return res.json(tasks);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Get single task
exports.getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await DeliveryTask.findById(id)
      .populate('customerUserId', 'name email phoneNumber')
      .populate('assignedTo', 'name email role');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.json(task);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await DeliveryTask.findByIdAndUpdate(id, req.body, { new: true })
      .populate('customerUserId', 'name email phoneNumber')
      .populate('assignedTo', 'name email role');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.json(task);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await DeliveryTask.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    return res.json({ message: 'Task deleted successfully' });
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Update task status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, meta } = req.body;

    const task = await DeliveryTask.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is assigned to this task or is admin/manager
    if (task.assignedTo.toString() !== req.user._id.toString() && 
        !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    task.status = status;
    if (meta) {
      task.meta = { ...task.meta, ...meta };
    }
    await task.save();

    return res.json(task);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Update my location (delivery staff)
exports.updateMyLocation = async (req, res) => {
  try {
    const { latitude, longitude, accuracy } = req.body;
    const userId = req.user._id;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'latitude and longitude are required' });
    }

    const location = await StaffLocation.findOneAndUpdate(
      { userId },
      { 
        userId, 
        location: { type: 'Point', coordinates: [longitude, latitude] },
        accuracy,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    return res.json(location);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// List staff locations (admin/manager)
exports.listStaffLocations = async (req, res) => {
  try {
    const locations = await StaffLocation.find()
      .populate('userId', 'name email role')
      .sort({ updatedAt: -1 });

    return res.json(locations);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// List delivered tasks for lab
exports.listDeliveredForLab = async (req, res) => {
  try {
    const tasks = await DeliveryTask.find({ status: 'delivered' })
      .populate('customerUserId', 'name email phoneNumber')
      .populate('assignedTo', 'name email role')
      .sort({ updatedAt: -1 });

    return res.json(tasks);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Get delivery stats for dashboard
exports.getDeliveryStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's tasks for this delivery staff
    const todayTasks = await DeliveryTask.find({
      assignedTo: userId,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const todayDeliveries = todayTasks.filter(task => 
      task.meta?.type === 'delivery' || task.title.toLowerCase().includes('delivery')
    ).length;

    const todayPickups = todayTasks.filter(task => 
      task.meta?.type === 'pickup' || task.title.toLowerCase().includes('pickup')
    ).length;

    const completedTasks = todayTasks.filter(task => task.status === 'completed').length;
    const pendingTasks = todayTasks.filter(task => 
      ['assigned', 'in_progress'].includes(task.status)
    ).length;

    // Calculate earnings (mock calculation - adjust based on your business logic)
    const totalEarnings = completedTasks * 100; // ₹100 per completed task

    res.json({
      todayDeliveries,
      todayPickups,
      completedTasks,
      pendingTasks,
      totalEarnings
    });
  } catch (error) {
    console.error('Error fetching delivery stats:', error);
    res.status(500).json({ message: 'Failed to fetch delivery stats' });
  }
};

// Get assigned tasks for delivery staff
exports.getAssignedTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const tasks = await DeliveryTask.find({
      assignedTo: userId,
      status: { $in: ['assigned', 'in_progress'] }
    })
    .populate('customerUserId', 'name email phoneNumber address')
    .sort({ scheduledAt: 1, createdAt: -1 })
    .limit(10);

    // Transform tasks to match frontend expectations
    const transformedTasks = tasks.map(task => ({
      id: task._id,
      title: task.title,
      type: task.meta?.type || (task.title.toLowerCase().includes('pickup') ? 'pickup' : 'delivery'),
      status: task.status,
      priority: task.meta?.priority || 'medium',
      scheduledTime: task.scheduledAt || task.createdAt,
      estimatedDuration: task.meta?.estimatedDuration || '30-45 mins',
      customer: {
        name: task.customerUserId?.name || 'Unknown Customer',
        phone: task.customerUserId?.phoneNumber || 'N/A',
        address: task.pickupAddress || task.customerUserId?.address || 'Address not provided',
        location: `https://maps.google.com/?q=${encodeURIComponent(task.pickupAddress || 'Unknown Location')}`
      },
      barrels: task.meta?.barrels || [],
      quantity: task.meta?.quantity || 1,
      completedTime: task.status === 'completed' ? task.updatedAt : null
    }));

    res.json({ tasks: transformedTasks });
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    res.status(500).json({ message: 'Failed to fetch assigned tasks' });
  }
};

// Get pending tasks (same as assigned tasks but with different endpoint)
exports.getPendingTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const tasks = await DeliveryTask.find({
      assignedTo: userId,
      status: { $in: ['assigned', 'in_progress'] }
    })
    .populate('customerUserId', 'name email phoneNumber address')
    .sort({ scheduledAt: 1, createdAt: -1 });

    // Transform tasks to match frontend expectations
    const transformedTasks = tasks.map(task => ({
      id: task._id,
      title: task.title,
      type: task.meta?.type || (task.title.toLowerCase().includes('pickup') ? 'pickup' : 'delivery'),
      status: task.status,
      priority: task.meta?.priority || 'medium',
      scheduledTime: task.scheduledAt || task.createdAt,
      estimatedDuration: task.meta?.estimatedDuration || '30-45 mins',
      customer: {
        name: task.customerUserId?.name || 'Unknown Customer',
        phone: task.customerUserId?.phoneNumber || 'N/A',
        address: task.pickupAddress || task.customerUserId?.address || 'Address not provided',
        location: `https://maps.google.com/?q=${encodeURIComponent(task.pickupAddress || 'Unknown Location')}`
      },
      barrels: task.meta?.barrels || [],
      quantity: task.meta?.quantity || 1,
      completedTime: task.status === 'completed' ? task.updatedAt : null
    }));

    res.json({ tasks: transformedTasks });
  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    res.status(500).json({ message: 'Failed to fetch pending tasks' });
  }
};

// Get today's deliveries
exports.getTodayDeliveries = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tasks = await DeliveryTask.find({
      assignedTo: userId,
      createdAt: { $gte: today, $lt: tomorrow },
      $or: [
        { 'meta.type': 'delivery' },
        { title: { $regex: 'delivery', $options: 'i' } }
      ]
    })
    .populate('customerUserId', 'name email phoneNumber address')
    .sort({ scheduledAt: 1, createdAt: -1 });

    // Transform tasks to match frontend expectations
    const transformedTasks = tasks.map(task => ({
      id: task._id,
      title: task.title,
      type: 'delivery',
      status: task.status,
      priority: task.meta?.priority || 'medium',
      scheduledTime: task.scheduledAt || task.createdAt,
      estimatedDuration: task.meta?.estimatedDuration || '30-45 mins',
      customer: {
        name: task.customerUserId?.name || 'Unknown Customer',
        phone: task.customerUserId?.phoneNumber || 'N/A',
        address: task.dropAddress || task.customerUserId?.address || 'Address not provided',
        location: `https://maps.google.com/?q=${encodeURIComponent(task.dropAddress || 'Unknown Location')}`
      },
      barrels: task.meta?.barrels || [],
      quantity: task.meta?.quantity || 1,
      completedTime: task.status === 'completed' ? task.updatedAt : null
    }));

    res.json({ deliveries: transformedTasks });
  } catch (error) {
    console.error('Error fetching today deliveries:', error);
    res.status(500).json({ message: 'Failed to fetch today deliveries' });
  }
};

// Get today's pickups
exports.getTodayPickups = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tasks = await DeliveryTask.find({
      assignedTo: userId,
      createdAt: { $gte: today, $lt: tomorrow },
      $or: [
        { 'meta.type': 'pickup' },
        { title: { $regex: 'pickup', $options: 'i' } }
      ]
    })
    .populate('customerUserId', 'name email phoneNumber address')
    .sort({ scheduledAt: 1, createdAt: -1 });

    // Transform tasks to match frontend expectations
    const transformedTasks = tasks.map(task => ({
      id: task._id,
      title: task.title,
      type: 'pickup',
      status: task.status,
      priority: task.meta?.priority || 'medium',
      scheduledTime: task.scheduledAt || task.createdAt,
      estimatedDuration: task.meta?.estimatedDuration || '30-45 mins',
      customer: {
        name: task.customerUserId?.name || 'Unknown Customer',
        phone: task.customerUserId?.phoneNumber || 'N/A',
        address: task.pickupAddress || task.customerUserId?.address || 'Address not provided',
        location: `https://maps.google.com/?q=${encodeURIComponent(task.pickupAddress || 'Unknown Location')}`
      },
      barrels: task.meta?.barrels || [],
      quantity: task.meta?.quantity || 1,
      completedTime: task.status === 'completed' ? task.updatedAt : null
    }));

    res.json({ pickups: transformedTasks });
  } catch (error) {
    console.error('Error fetching today pickups:', error);
    res.status(500).json({ message: 'Failed to fetch today pickups' });
  }
};

// Get earnings data
exports.getEarnings = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate date ranges
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get completed tasks for different periods
    const todayTasks = await DeliveryTask.countDocuments({
      assignedTo: userId,
      status: 'completed',
      updatedAt: { $gte: today, $lt: tomorrow }
    });

    const weekTasks = await DeliveryTask.countDocuments({
      assignedTo: userId,
      status: 'completed',
      updatedAt: { $gte: weekStart }
    });

    const monthTasks = await DeliveryTask.countDocuments({
      assignedTo: userId,
      status: 'completed',
      updatedAt: { $gte: monthStart }
    });

    const totalTasks = await DeliveryTask.countDocuments({
      assignedTo: userId,
      status: 'completed'
    });

    // Calculate earnings (₹100 per completed task - adjust based on your business logic)
    const ratePerTask = 100;
    const summary = {
      today: todayTasks * ratePerTask,
      thisWeek: weekTasks * ratePerTask,
      thisMonth: monthTasks * ratePerTask,
      total: totalTasks * ratePerTask
    };

    // Get recent earnings history
    const recentTasks = await DeliveryTask.find({
      assignedTo: userId,
      status: 'completed'
    })
    .populate('customerUserId', 'name')
    .sort({ updatedAt: -1 })
    .limit(20);

    const history = recentTasks.map(task => ({
      id: task._id,
      date: task.updatedAt,
      task: task.title,
      customer: task.customerUserId?.name || 'Unknown Customer',
      amount: ratePerTask,
      type: task.meta?.type || 'delivery'
    }));

    res.json({ summary, history });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    res.status(500).json({ message: 'Failed to fetch earnings' });
  }
};

// Handle task actions (start, complete, etc.)
exports.handleTaskAction = async (req, res) => {
  try {
    const { id, action } = req.params;
    const userId = req.user._id;
    const { timestamp, location } = req.body;

    const task = await DeliveryTask.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user is assigned to this task
    if (task.assignedTo.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // Handle different actions
    switch (action) {
      case 'start':
        if (task.status !== 'assigned') {
          return res.status(400).json({ message: 'Task cannot be started' });
        }
        task.status = 'in_progress';
        task.meta = { ...task.meta, startedAt: timestamp || new Date() };
        break;

      case 'complete':
        if (task.status !== 'in_progress') {
          return res.status(400).json({ message: 'Task cannot be completed' });
        }
        task.status = 'completed';
        task.meta = { ...task.meta, completedAt: timestamp || new Date() };
        break;

      case 'cancel':
        if (['completed', 'cancelled'].includes(task.status)) {
          return res.status(400).json({ message: 'Task cannot be cancelled' });
        }
        task.status = 'cancelled';
        task.meta = { ...task.meta, cancelledAt: timestamp || new Date() };
        break;

      default:
        return res.status(400).json({ message: 'Invalid action' });
    }

    // Add location if provided
    if (location) {
      task.meta = { 
        ...task.meta, 
        [`${action}Location`]: location 
      };
    }

    await task.save();

    res.json({
      success: true,
      message: `Task ${action}ed successfully`,
      task: {
        id: task._id,
        status: task.status,
        updatedAt: task.updatedAt
      }
    });
  } catch (error) {
    console.error('Error handling task action:', error);
    res.status(500).json({ message: 'Failed to update task' });
  }
};

// Barrel intake functions
exports.intakeBarrels = async (req, res) => {
  try {
    const { barrelCount, customerName, customerPhone, address, notes, barrelIds, taskId, requestId, arrivalTime, location, locationAccuracy } = req.body;
    const userId = req.user._id; // The user who owns the barrels (or delivery staff recording pickup)
    const userRole = req.user.role; // Get user role

    if (!barrelCount || !customerName) {
      return res.status(400).json({ message: 'barrelCount and customerName are required' });
    }

    // ✅ VALIDATE ADDRESS IS PROVIDED (MANDATORY FOR SELL BARREL REQUESTS)
    if (!address || address.trim() === '') {
      return res.status(400).json({ 
        success: false,
        message: 'Address is required for sell barrel requests. Please provide your complete address.' 
      });
    }

    const count = Number(barrelCount);
    if (count < 1) {
      return res.status(400).json({ message: 'Barrel count must be at least 1' });
    }

    const Barrel = require('../models/barrelModel');
    let selectedBarrelIds = [];
    let actualUserId = userId; // Default to current user

    // ✅ CHECK IF THIS IS A DELIVERY STAFF RECORDING PICKUP
    // Delivery staff should NEVER have barrel validation - they don't own barrels
    const isDeliveryStaff = userRole === 'delivery' || userRole === 'delivery_staff';
    
    if (isDeliveryStaff || requestId) {
      console.log(`\n📦 Delivery staff recording pickup (Role: ${userRole}, RequestId: ${requestId || 'none'})`);
      
      // Try to find existing intake if requestId provided
      if (requestId) {
        const existingIntake = await DeliveryIntake.findById(requestId);
        if (existingIntake) {
          selectedBarrelIds = existingIntake.barrelIds || [];
          actualUserId = existingIntake.userId || userId;
          console.log(`✅ Found existing intake with ${selectedBarrelIds.length} barrel(s) already allocated`);
          console.log(`📋 Barrels: ${selectedBarrelIds.join(', ')}`);
        } else {
          console.log(`⚠️  Request ${requestId} not found as intake, proceeding without barrel validation`);
        }
      } else {
        console.log(`⚠️  No requestId provided, but user is delivery staff - skipping barrel validation`);
      }
      // Skip barrel validation for delivery staff
    } else {
      // ✅ THIS IS A NEW SELL REQUEST FROM USER - VALIDATE AND ALLOCATE BARRELS
      console.log(`\n📦 User ${userId} creating new sell request for ${count} barrel(s)`);
      
      const userBarrels = await Barrel.find({ 
        assignedTo: userId,
        status: 'in-use' // Only count barrels currently in use by the user
      }).sort({ assignedDate: 1 }); // Oldest first (FIFO)

      const availableCount = userBarrels.length;

      if (availableCount < count) {
        return res.status(400).json({ 
          success: false,
          message: `Insufficient barrels. You have ${availableCount} barrel(s) available, but requested to sell ${count} barrel(s).`,
          available: availableCount,
          requested: count
        });
      }

      // ✅ SELECT BARRELS TO SELL (FIFO - First In, First Out)
      const barrelsToSell = userBarrels.slice(0, count);
      selectedBarrelIds = barrelsToSell.map(b => b.barrelId);

      console.log(`✅ Available: ${availableCount}, Requested: ${count}`);
      console.log(`📋 Selected barrels: ${selectedBarrelIds.join(', ')}`);

      // ✅ UPDATE BARREL STATUS TO 'PENDING_SALE'
      for (const barrel of barrelsToSell) {
        barrel.status = 'pending_sale'; // Mark as pending sale
        barrel.lastKnownLocation = 'Pending Sale - User Request';
        barrel.notes = `Sell request created on ${new Date().toLocaleDateString()}`;
        await barrel.save();
        console.log(`   ✓ Barrel ${barrel.barrelId} marked as pending_sale`);
      }
    }

    const intakeData = {
      createdBy: userId, // User/delivery staff creating the record
      userId: actualUserId, // User who owns the barrels
      name: customerName,
      phone: customerPhone,
      address: address.trim(), // Store the address
      barrelCount: count,
      notes,
      barrelIds: selectedBarrelIds, // Store the actual barrel IDs being sold
      taskId,
      requestId,
      arrivalTime: arrivalTime || new Date(),
      status: 'pending'
    };

    // Add location data if provided
    if (location && location.coordinates && location.coordinates.length === 2) {
      intakeData.location = location;
      intakeData.locationAccuracy = locationAccuracy;
    }

    const intake = await DeliveryIntake.create(intakeData);

    console.log(`✅ Sell barrel request created: ${intake._id}`);
    if (!requestId) {
      // Only log remaining barrels for new requests
      const Barrel = require('../models/barrelModel');
      const remainingBarrels = await Barrel.countDocuments({ 
        assignedTo: actualUserId,
        status: 'in-use'
      });
      console.log(`📊 User now has ${remainingBarrels} barrel(s) available`);
    }

    // Automatically update the task status to intake_completed if taskId is provided
    if (taskId) {
      try {
        // Remove 'sr_' prefix if present
        const actualTaskId = taskId.startsWith('sr_') ? taskId.substring(3) : taskId;
        
        // Update task status
        await DeliveryTask.findByIdAndUpdate(actualTaskId, { 
          status: 'intake_completed',
          'meta.intakeId': intake._id,
          'meta.intakeCompletedAt': new Date()
        });
        
        console.log(`Task ${actualTaskId} marked as intake_completed`);
      } catch (updateError) {
        console.error('Error updating task status:', updateError);
        // Don't fail the intake if task update fails
      }
    }

    // Calculate remaining barrels only for new requests
    let remainingBarrels = 0;
    if (!requestId) {
      const Barrel = require('../models/barrelModel');
      remainingBarrels = await Barrel.countDocuments({ 
        assignedTo: actualUserId,
        status: 'in-use'
      });
    }

    return res.status(201).json({
      success: true,
      intake,
      barrelsSelected: selectedBarrelIds,
      remainingBarrels: requestId ? null : remainingBarrels,
      message: requestId 
        ? `Successfully recorded pickup for ${count} barrel(s).`
        : `Successfully created sell request for ${count} barrel(s). ${remainingBarrels} barrel(s) remaining.`
    });
  } catch (e) {
    console.error('Error creating sell barrel intake:', e);
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.listIntakes = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = {};
    if (status) query.status = status;

    const intakes = await DeliveryIntake.find(query)
      .populate('createdBy', 'name email role')
      .populate('userId', 'name email phoneNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await DeliveryIntake.countDocuments(query);

    return res.json({ items: intakes, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (e) {
    console.error('Error listing intakes:', e);
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.listMyIntakes = async (req, res) => {
  try {
    const userId = req.user._id;
    // Find intakes where the user is either the creator or the owner
    const intakes = await DeliveryIntake.find({ 
      $or: [
        { createdBy: userId },
        { userId: userId }
      ]
    })
    .populate('userId', 'name email phoneNumber')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

    return res.json(intakes);
  } catch (e) {
    console.error('Error listing my intakes:', e);
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.verifyIntake = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await DeliveryIntake.findById(id);
    if (!doc) return res.status(404).json({ message: 'Intake not found' });
    doc.status = 'manager_verified';
    doc.verifiedAt = new Date();
    doc.verifiedBy = req.user._id;
    await doc.save();

    // Optionally create a Delivery Task if details are provided
    const { assignedTo, pickupAddress, dropAddress, scheduledAt, notes, title } = req.body || {};
    let task = null;
    if (assignedTo && pickupAddress && dropAddress) {
      task = await DeliveryTask.create({
        title: title || `Barrel Pickup (${doc.barrelCount})`,
        customerUserId: req.user._id, // manager initiator; can be updated to actual customer later if needed
        assignedTo,
        pickupAddress,
        dropAddress,
        scheduledAt,
        notes,
        meta: { intakeId: doc._id, barrelCount: doc.barrelCount }
      });
    }

    return res.json({ intake: doc, task });
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.approveIntake = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await DeliveryIntake.findById(id);
    if (!doc) return res.status(404).json({ message: 'Intake not found' });
    
    // Try to populate userId if it exists
    if (doc.userId) {
      await doc.populate('userId', 'name email');
    }
    
    const previousStatus = doc.status;
    doc.status = 'approved';
    doc.approvedAt = new Date();
    doc.approvedBy = req.user._id;
    await doc.save();

    // ✅ UPDATE BARREL STATUS TO 'SOLD' WHEN APPROVED
    if (doc.barrelIds && doc.barrelIds.length > 0) {
      const Barrel = require('../models/barrelModel');
      let updatedCount = 0;
      
      console.log(`\n✅ Approving sell request ${id}`);
      console.log(`📦 Updating ${doc.barrelIds.length} barrel(s) to 'sold' status`);
      
      for (const barrelId of doc.barrelIds) {
        try {
          const barrel = await Barrel.findOne({ barrelId: barrelId });
          if (barrel) {
            barrel.status = 'sold';
            barrel.lastKnownLocation = 'Sold - Approved by Manager/Accountant';
            barrel.notes = `Sold on ${new Date().toLocaleDateString()} - Intake: ${id}`;
            barrel.assignedTo = null; // Remove assignment since barrel is sold
            await barrel.save();
            updatedCount++;
            console.log(`   ✓ Barrel ${barrelId} marked as sold`);
          } else {
            console.warn(`   ⚠️  Barrel ${barrelId} not found`);
          }
        } catch (barrelError) {
          console.error(`   ❌ Error updating barrel ${barrelId}:`, barrelError.message);
        }
      }
      
      console.log(`✅ Updated ${updatedCount}/${doc.barrelIds.length} barrel(s) to sold status`);
    }

    // Send notification to user (only if userId exists)
    if (doc.userId) {
      try {
        const Notification = require('../models/Notification');
        const userIdToNotify = doc.userId._id || doc.userId;
        await Notification.create({
          userId: userIdToNotify,
          role: 'user',
          title: '✅ Sell Request Approved',
          message: `Your request to sell ${doc.barrelCount} barrel(s) has been approved! Payment will be processed soon.`,
          read: false
        });
        console.log(`✅ Notification sent to user ${userIdToNotify}`);
      } catch (notifError) {
        console.error('Error creating notification:', notifError.message);
      }
    } else {
      console.log('ℹ️  No userId found, skipping notification');
    }

    return res.json({
      success: true,
      intake: doc,
      barrelsUpdated: doc.barrelIds ? doc.barrelIds.length : 0,
      message: `Sell request approved. ${doc.barrelIds ? doc.barrelIds.length : 0} barrel(s) marked as sold.`
    });
  } catch (e) {
    console.error('Error approving intake:', e);
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.getIntake = async (req, res) => {
  try {
    const { id } = req.params;
    const intake = await DeliveryIntake.findById(id)
      .populate('createdBy', 'name email role')
      .populate('userId', 'name email phoneNumber')
      .populate('verifiedBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!intake) {
      return res.status(404).json({ message: 'Intake not found' });
    }

    return res.json(intake);
  } catch (e) {
    console.error('Error getting intake:', e);
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.updateIntake = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;
    
    const intake = await DeliveryIntake.findById(id);
    if (!intake) {
      return res.status(404).json({ message: 'Intake not found' });
    }

    // Try to populate userId if it exists
    if (intake.userId) {
      await intake.populate('userId', 'name email');
    }

    const oldStatus = intake.status;

    // ✅ HANDLE STATUS CHANGE TO 'REJECTED' - RETURN BARRELS TO USER
    if (newStatus === 'rejected' && oldStatus !== 'rejected') {
      if (intake.barrelIds && intake.barrelIds.length > 0 && intake.userId) {
        const Barrel = require('../models/barrelModel');
        let returnedCount = 0;
        
        const userIdValue = intake.userId._id || intake.userId;
        console.log(`\n❌ Rejecting sell request ${id}`);
        console.log(`🔄 Returning ${intake.barrelIds.length} barrel(s) to user ${userIdValue}`);
        
        for (const barrelId of intake.barrelIds) {
          try {
            const barrel = await Barrel.findOne({ barrelId: barrelId });
            if (barrel) {
              barrel.status = 'in-use'; // Return to in-use status
              barrel.assignedTo = userIdValue; // Re-assign to user
              barrel.lastKnownLocation = 'Returned - Sell Request Rejected';
              barrel.notes = `Sell request rejected on ${new Date().toLocaleDateString()}`;
              await barrel.save();
              returnedCount++;
              console.log(`   ✓ Barrel ${barrelId} returned to user`);
            }
          } catch (barrelError) {
            console.error(`   ❌ Error returning barrel ${barrelId}:`, barrelError.message);
          }
        }
        
        console.log(`✅ Returned ${returnedCount}/${intake.barrelIds.length} barrel(s) to user`);
        
        // Send notification to user
        try {
          const Notification = require('../models/Notification');
          await Notification.create({
            userId: userIdValue,
            role: 'user',
            title: '❌ Sell Request Rejected',
            message: `Your request to sell ${intake.barrelCount} barrel(s) has been rejected. The barrels have been returned to your account.`,
            read: false
          });
          console.log(`✅ Notification sent to user ${userIdValue}`);
        } catch (notifError) {
          console.error('Error creating notification:', notifError.message);
        }
      } else if (newStatus === 'rejected' && !intake.userId) {
        console.log('ℹ️  No userId found for rejected request, skipping barrel return');
      }
    }

    // Update the intake - use Object.assign but skip validation for partial updates
    Object.assign(intake, req.body);
    await intake.save({ validateModifiedOnly: true });
    
    await intake.populate('createdBy', 'name email role');

    return res.json({
      success: true,
      intake,
      barrelsReturned: (newStatus === 'rejected' && intake.barrelIds) ? intake.barrelIds.length : 0,
      message: newStatus === 'rejected' 
        ? `Sell request rejected. ${intake.barrelIds ? intake.barrelIds.length : 0} barrel(s) returned to user.`
        : 'Intake updated successfully'
    });
  } catch (e) {
    console.error('Error updating intake:', e);
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.deleteIntake = async (req, res) => {
  try {
    const { id } = req.params;
    const intake = await DeliveryIntake.findById(id);

    if (!intake) {
      return res.status(404).json({ message: 'Intake not found' });
    }

    // ✅ RETURN BARRELS TO USER BEFORE DELETING (if not already sold/approved)
    if (intake.status !== 'approved' && intake.status !== 'billed' && intake.barrelIds && intake.barrelIds.length > 0) {
      const Barrel = require('../models/barrelModel');
      let returnedCount = 0;
      
      console.log(`\n🗑️  Deleting sell request ${id}`);
      console.log(`🔄 Returning ${intake.barrelIds.length} barrel(s) to user ${intake.userId}`);
      
      for (const barrelId of intake.barrelIds) {
        try {
          const barrel = await Barrel.findOne({ barrelId: barrelId });
          if (barrel && barrel.status === 'pending_sale') {
            barrel.status = 'in-use'; // Return to in-use status
            barrel.assignedTo = intake.userId; // Re-assign to user
            barrel.lastKnownLocation = 'Returned - Request Deleted';
            barrel.notes = `Sell request deleted on ${new Date().toLocaleDateString()}`;
            await barrel.save();
            returnedCount++;
            console.log(`   ✓ Barrel ${barrelId} returned to user`);
          }
        } catch (barrelError) {
          console.error(`   ❌ Error returning barrel ${barrelId}:`, barrelError.message);
        }
      }
      
      console.log(`✅ Returned ${returnedCount}/${intake.barrelIds.length} barrel(s) to user before deletion`);
    }

    await intake.deleteOne();

    return res.json({ 
      success: true,
      message: 'Intake deleted successfully',
      barrelsReturned: intake.barrelIds ? intake.barrelIds.length : 0
    });
  } catch (e) {
    console.error('Error deleting intake:', e);
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Sell allowance functions
exports.getMySellAllowance = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('sellAllowance');
    
    return res.json({ 
      sellAllowance: user?.sellAllowance || 0,
      unlimited: !user?.sellAllowance || user.sellAllowance === 0
    });
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

exports.setUserSellAllowance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { sellAllowance } = req.body;

    if (sellAllowance < 0) {
      return res.status(400).json({ message: 'Sell allowance cannot be negative' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        sellAllowance,
        sellAllowanceUpdatedAt: new Date(),
        sellAllowanceSetBy: req.user._id
      },
      { new: true }
    ).select('name email sellAllowance sellAllowanceUpdatedAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (e) {
    return res.status(500).json({ message: 'Server Error', error: e.message });
  }
};

// Get delivery staff shift schedule
exports.getDeliveryShiftSchedule = async (req, res) => {
  try {
    const StaffSchedule = require('../models/staffScheduleModel');
    const staffId = req.user._id;
    
    // Get current week dates
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Fetch schedules for this week from StaffSchedule collection
    const schedules = await StaffSchedule.find({
      staffId: staffId,
      date: {
        $gte: startOfWeek,
        $lte: endOfWeek
      }
    }).sort({ date: 1 });

    // Get all active shifts from Shift model for display
    const allShifts = await Shift.find({ isActive: true })
      .populate('assignedStaff', 'name email role')
      .sort({ startTime: 1 });

    // Format all shifts for display
    const formattedShifts = allShifts.map(shift => ({
      _id: shift._id,
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      duration: shift.duration,
      gracePeriod: shift.gracePeriod,
      description: shift.description,
      isActive: shift.isActive,
      assignedStaffCount: shift.assignedStaff.length
    }));

    // Format my assignment from StaffSchedule
    let myAssignment = null;
    if (schedules && schedules.length > 0) {
      // Group schedules by shift type and get working days
      const workingDays = [];
      const shiftTypes = {};
      
      schedules.forEach(schedule => {
        const dayIndex = new Date(schedule.date).getDay();
        workingDays.push(dayIndex);
        shiftTypes[schedule.shift] = (shiftTypes[schedule.shift] || 0) + 1;
      });

      // Determine primary shift (most common)
      const primaryShift = Object.keys(shiftTypes).reduce((a, b) => 
        shiftTypes[a] > shiftTypes[b] ? a : b
      );

      // Set shift times based on shift type
      let startTime, endTime, duration;
      if (primaryShift === 'morning') {
        startTime = '06:00';
        endTime = '14:00';
        duration = '8 hours';
      } else if (primaryShift === 'evening') {
        startTime = '14:00';
        endTime = '22:00';
        duration = '8 hours';
      } else {
        startTime = '22:00';
        endTime = '06:00';
        duration = '8 hours';
      }

      myAssignment = {
        shiftType: primaryShift.charAt(0).toUpperCase() + primaryShift.slice(1),
        startTime: startTime,
        endTime: endTime,
        duration: duration,
        days: workingDays,
        description: `${primaryShift.charAt(0).toUpperCase() + primaryShift.slice(1)} shift assigned by manager`
      };
    }

    const response = {
      weekStart: startOfWeek.toISOString(),
      weekEnd: endOfWeek.toISOString(),
      myAssignment,
      allShifts: formattedShifts
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching delivery shift schedule:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};