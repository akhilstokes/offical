const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/userModel');

// This single line imports all necessary functions from the controller at once
const { 
    listUsers,
    listFarmers,
    submitBillRequest, 
    getUserProfile, 
    updateUserProfile,
    getMySubmissions 
} = require('../controllers/userController');

// Public/protected users listing used by staff dispatch selections
router.get('/', protect, listUsers);
// Farmers list for field collection forms
router.get('/farmers', protect, listFarmers);

// Find user by phone number (for billing)
router.get('/find-by-phone', protect, async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number is required' 
      });
    }
    
    // Clean phone number - remove all non-digits
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Try to find user with various phone formats
    const user = await User.findOne({
      $or: [
        { phoneNumber: phone },
        { phoneNumber: cleanPhone },
        { phoneNumber: `+91${cleanPhone}` },
        { phoneNumber: `91${cleanPhone}` },
        { phoneNumber: `0${cleanPhone}` }
      ]
    }).select('_id name email phoneNumber role');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found with this phone number' 
      });
    }
    
    res.json({
      success: true,
      user,
      userId: user._id
    });
  } catch (error) {
    console.error('Error finding user by phone:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to find user' 
    });
  }
});

// Get all staff members (for manager schedule page)
router.get('/all-staff', protect, async (req, res) => {
  try {
    const staff = await User.find({
      role: { $in: ['field_staff', 'delivery_staff', 'lab_staff', 'staff', 'accountant'] }
    }).select('name email phoneNumber role').sort({ name: 1 });

    res.json({
      success: true,
      count: staff.length,
      staff
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch staff' 
    });
  }
});

// Define the routes for the user
router.post('/submit-bill', protect, submitBillRequest);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/my-submissions', protect, getMySubmissions);

// PATCH route to update specific user fields (like dailySalary)
router.patch('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Only allow certain fields to be updated via PATCH
    const allowedUpdates = ['dailySalary', 'baseSalary', 'salaryType', 'allowances', 'overtime', 'bonus'];
    const updateKeys = Object.keys(updates);
    const isValidUpdate = updateKeys.every(key => allowedUpdates.includes(key));

    if (!isValidUpdate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid update fields'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('_id name email role dailySalary baseSalary salaryType');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

module.exports = router;