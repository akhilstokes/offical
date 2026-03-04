 const express = require('express');
const router = express.Router();
const { addBarrel, updateBarrel, getAllBarrels, getNextToUse, getExpiryQueue, markInUse, updateWeights, setLocation, setCondition, assignBatch, listMyAssigned, listDispatchHistory } = require('../controllers/barrelController');

const { protect, admin, labOnly, adminOrManager } = require('../middleware/authMiddleware');

// Only admin can add new barrels
router.post('/', protect, admin, addBarrel);
// Any authorized user (admin or field staff) can update a barrel
router.put('/:id', protect, updateBarrel);
// Any authorized user can view all barrels
router.get('/', protect, getAllBarrels);

// Allocation endpoints
router.post('/assign-batch', protect, adminOrManager, assignBatch);
router.get('/my-assigned', protect, listMyAssigned);
router.get('/dispatch-history', protect, adminOrManager, listDispatchHistory);

// Assign delivery staff to approved barrel request
router.post('/assign-delivery', protect, admin, async (req, res) => {
  try {
    const { requestId, deliveryStaffId, deliveryDate, deliveryLocation } = req.body;
    
    // Import required models
    const BarrelRequest = require('../models/barrelRequestModel');
    const User = require('../models/userModel');
    const Notification = require('../models/Notification');
    const Barrel = require('../models/barrelModel');
    
    // Find the request and populate user details
    const request = await BarrelRequest.findById(requestId).populate('user', 'name email');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    // Find the delivery staff
    const deliveryStaff = await User.findById(deliveryStaffId);
    if (!deliveryStaff) {
      return res.status(404).json({ success: false, message: 'Delivery staff not found' });
    }
    
    // Update request with delivery staff assignment
    request.deliveryStaff = deliveryStaffId;
    request.deliveryDate = deliveryDate;
    request.deliveryLocation = deliveryLocation;
    request.assignedAt = new Date();
    
    // ✅ MARK ASSIGNED BARRELS AS IN-USE
    if (request.assignedBarrels && request.assignedBarrels.length > 0) {
      const assignedDate = new Date();
      let barrelUpdateCount = 0;
      let barrelNotFoundCount = 0;
      const notFoundBarrels = [];
      
      console.log(`\n🔍 Processing ${request.assignedBarrels.length} barrels for delivery staff assignment...`);
      console.log(`📦 Barrel IDs to assign: ${request.assignedBarrels.join(', ')}`);
      
      for (const barrelId of request.assignedBarrels) {
        try {
          const barrel = await Barrel.findOne({ barrelId: barrelId });
          if (barrel) {
            barrel.status = 'in-use';
            barrel.assignedTo = request.user._id;
            barrel.assignedDate = assignedDate;
            await barrel.save();
            barrelUpdateCount++;
            console.log(`✅ Barrel ${barrelId} marked as IN-USE, assigned to ${request.user.name}`);
          } else {
            barrelNotFoundCount++;
            notFoundBarrels.push(barrelId);
            console.error(`❌ Barrel ${barrelId} NOT FOUND in database!`);
          }
        } catch (barrelError) {
          console.error(`❌ Error updating barrel ${barrelId}:`, barrelError);
          barrelNotFoundCount++;
          notFoundBarrels.push(barrelId);
        }
      }
      
      console.log(`\n📊 Summary: ${barrelUpdateCount} barrels assigned, ${barrelNotFoundCount} barrels not found`);
      if (notFoundBarrels.length > 0) {
        console.error(`⚠️  Missing barrels: ${notFoundBarrels.join(', ')}`);
      }
    }
    
    await request.save();
    
    // Format delivery date for notification
    const formattedDate = new Date(deliveryDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    
    // Send notification to USER
    try {
      await Notification.create({
        userId: request.user._id,
        role: 'user',
        title: '✅ Barrel Request Approved & Delivery Scheduled',
        message: `Your request for ${request.quantity} barrel(s) has been approved! Delivery scheduled for ${formattedDate} at ${deliveryLocation}. Delivery staff: ${deliveryStaff.name}`,
        read: false
      });
    } catch (notifError) {
      console.error('Error creating user notification:', notifError);
    }
    
    // Send notification to DELIVERY STAFF
    try {
      await Notification.create({
        userId: deliveryStaffId,
        role: 'staff',
        title: '📦 New Delivery Assignment',
        message: `You have been assigned to deliver ${request.quantity} barrel(s) to ${request.user.name} on ${formattedDate}. Location: ${deliveryLocation}`,
        read: false
      });
    } catch (notifError) {
      console.error('Error creating delivery staff notification:', notifError);
    }
    
    res.json({ 
      success: true, 
      message: 'Delivery staff assigned successfully. Notifications sent to user and delivery staff.',
      request 
    });
  } catch (error) {
    console.error('Error assigning delivery staff:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Assign barrels to user request (INTEGRATED WITH REGISTER SYSTEM)
router.post('/assign', protect, admin, async (req, res) => {
  try {
    const { requestId, barrelIds, source, userId, expectedReturnDays = 30 } = req.body;
    
    const BarrelRequest = require('../models/barrelRequestModel');
    const BarrelIssueRegister = require('../models/barrelIssueRegisterModel');
    const Barrel = require('../models/barrelModel');
    
    // Find the request and populate user details
    const request = await BarrelRequest.findById(requestId).populate('user', 'name email phoneNumber');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    // Check if any barrels are already assigned
    const alreadyAssignedBarrels = [];
    for (const barrelId of barrelIds) {
      const barrel = await Barrel.findOne({ barrelId: barrelId });
      if (barrel && (barrel.status === 'in-use' || barrel.status === 'assigned')) {
        alreadyAssignedBarrels.push({
          barrelId: barrelId,
          assignedTo: barrel.assignedTo,
          status: barrel.status
        });
      }
    }
    
    // If any barrels are already assigned, return error
    if (alreadyAssignedBarrels.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot assign barrels. The following barrels are already in use: ${alreadyAssignedBarrels.map(b => b.barrelId).join(', ')}`,
        alreadyAssigned: alreadyAssignedBarrels
      });
    }
    
    // Update request with assigned barrels
    request.assignedBarrels = barrelIds;
    request.barrelSource = source;
    request.status = 'assigned';
    request.assignedAt = new Date();
    
    await request.save();
    
    // Create register entries for each barrel (ONE entry per barrel)
    console.log(`Creating ${barrelIds.length} register entries for request ${requestId}`);
    
    const issueDate = new Date();
    const expectedReturnDate = new Date();
    expectedReturnDate.setDate(expectedReturnDate.getDate() + expectedReturnDays);
    
    const registerEntries = [];
    
    for (const barrelId of barrelIds) {
      try {
        // Generate unique register ID
        const registerId = await BarrelIssueRegister.generateRegisterId();
        
        // Find barrel details (if exists in database)
        let barrelSnapshot = {
          type: 'standard',
          capacity: '200L',
          material: 'plastic'
        };
        
        const barrel = await Barrel.findOne({ barrelId: barrelId });
        if (barrel) {
          barrelSnapshot = {
            type: barrel.type || 'standard',
            capacity: barrel.capacity || '200L',
            material: barrel.material || 'plastic'
          };
          
          // ✅ UPDATE BARREL STATUS TO IN-USE AND TRACK USER
          barrel.status = 'in-use';
          barrel.assignedTo = request.user._id;
          barrel.assignedDate = issueDate;
          await barrel.save();
          
          console.log(`✅ Barrel ${barrelId} marked as IN-USE, assigned to ${request.user.name}`);
        }
        
        // Create register entry
        const registerEntry = await BarrelIssueRegister.create({
          registerId,
          requestId: request._id,
          userId: request.user._id,
          userNameSnapshot: request.user.name,
          userEmailSnapshot: request.user.email,
          barrelId: barrelId,
          barrelSnapshot,
          issueDate,
          expectedReturnDate,
          issuedByAdminId: req.user._id,
          issuedByAdminName: req.user.name,
          status: 'ISSUED',
          issueNotes: `Assigned from ${source} inventory`,
          deliveryStaffId: request.deliveryStaff,
          deliveryDate: request.deliveryDate,
          deliveryLocation: request.deliveryLocation
        });
        
        registerEntries.push(registerEntry);
        console.log(`✅ Created register entry: ${registerId} for barrel ${barrelId}`);
      } catch (entryError) {
        console.error(`Error creating register entry for barrel ${barrelId}:`, entryError);
      }
    }
    
    console.log(`✅ Successfully created ${registerEntries.length} register entries`);
    console.log(`✅ All barrels marked as IN-USE and unavailable for other assignments`);
    
    res.json({ 
      success: true, 
      message: `Successfully assigned ${barrelIds.length} barrel(s) and created ${registerEntries.length} register entries. Barrels are now unavailable for other users.`,
      request,
      registerEntries: registerEntries.length
    });
  } catch (error) {
    console.error('Error assigning barrels:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get returned barrels
router.get('/returned', protect, adminOrManager, async (req, res) => {
  try {
    // In a real implementation, fetch from ReturnedBarrel model
    // For now, return empty array
    res.json({ 
      success: true,
      returnedBarrels: []
    });
  } catch (error) {
    console.error('Error fetching returned barrels:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get my delivery tasks (for delivery staff)
router.get('/my-delivery-tasks', protect, async (req, res) => {
  try {
    const BarrelRequest = require('../models/barrelRequestModel');
    
    // Find all requests assigned to this delivery staff
    const tasks = await BarrelRequest.find({
      deliveryStaff: req.user._id
    })
    .populate('user', 'name email phoneNumber address')
    .sort({ deliveryDate: 1 });
    
    res.json({ 
      success: true,
      tasks 
    });
  } catch (error) {
    console.error('Error fetching delivery tasks:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Complete delivery (mark as delivered)
router.put('/complete-delivery/:requestId', protect, async (req, res) => {
  try {
    const BarrelRequest = require('../models/barrelRequestModel');
    const Notification = require('../models/Notification');
    const Barrel = require('../models/barrelModel');
    
    const request = await BarrelRequest.findById(req.params.requestId).populate('user', 'name email');
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    // Verify this delivery staff is assigned to this task
    if (request.deliveryStaff.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    // ✅ ENSURE BARRELS ARE MARKED AS IN-USE AND ASSIGNED TO USER
    if (request.assignedBarrels && request.assignedBarrels.length > 0) {
      const deliveryDate = new Date();
      let barrelUpdateCount = 0;
      let barrelNotFoundCount = 0;
      const notFoundBarrels = [];
      
      console.log(`\n🔍 Processing ${request.assignedBarrels.length} barrels for delivery completion...`);
      console.log(`📦 Barrel IDs to assign: ${request.assignedBarrels.join(', ')}`);
      
      for (const barrelId of request.assignedBarrels) {
        try {
          const barrel = await Barrel.findOne({ barrelId: barrelId });
          if (barrel) {
            // Only update if not already assigned to this user
            if (!barrel.assignedTo || barrel.assignedTo.toString() !== request.user._id.toString()) {
              barrel.status = 'in-use';
              barrel.assignedTo = request.user._id;
              barrel.assignedDate = deliveryDate;
              barrel.lastKnownLocation = request.deliveryLocation || 'User Location';
              await barrel.save();
              barrelUpdateCount++;
              console.log(`✅ Barrel ${barrelId} marked as IN-USE and assigned to ${request.user.name}`);
            } else {
              console.log(`ℹ️  Barrel ${barrelId} already assigned to this user`);
              barrelUpdateCount++;
            }
          } else {
            barrelNotFoundCount++;
            notFoundBarrels.push(barrelId);
            console.error(`❌ Barrel ${barrelId} NOT FOUND in database!`);
          }
        } catch (barrelError) {
          console.error(`❌ Error updating barrel ${barrelId}:`, barrelError);
          barrelNotFoundCount++;
          notFoundBarrels.push(barrelId);
        }
      }
      
      console.log(`\n📊 Summary: ${barrelUpdateCount} barrels assigned, ${barrelNotFoundCount} barrels not found`);
      if (notFoundBarrels.length > 0) {
        console.error(`⚠️  Missing barrels: ${notFoundBarrels.join(', ')}`);
      }
    }
    
    // Update delivery status
    request.deliveryStatus = 'delivered';
    request.deliveredAt = new Date();
    request.status = 'fulfilled';
    
    await request.save();
    
    // Send notification to user
    try {
      await Notification.create({
        userId: request.user._id,
        role: 'user',
        title: '✅ Barrels Delivered Successfully',
        message: `Your ${request.quantity} barrel(s) have been delivered by ${req.user.name}. You can now view them in "My Barrels" section!`,
        read: false
      });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
    }
    
    res.json({ 
      success: true, 
      message: 'Delivery marked as completed. Barrels are now assigned to user.',
      request,
      barrelsAssigned: request.assignedBarrels ? request.assignedBarrels.length : 0
    });
  } catch (error) {
    console.error('Error completing delivery:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// New lifecycle endpoints
router.put('/:id/weights', protect, labOnly, updateWeights);
router.put('/:id/location', protect, setLocation); // allow lab/field via protect for now
router.put('/:id/condition', protect, adminOrManager, setCondition);
// FEFO endpoints
router.get('/fefo/next', protect, getNextToUse);
router.get('/fefo/queue', protect, getExpiryQueue);
router.post('/:id/mark-in-use', protect, markInUse);

module.exports = router;