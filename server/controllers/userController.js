const BillRequest = require('../models/billRequestModel');
const User = require('../models/userModel');

/**
 * @desc    List users for selection (minimal fields)
 * @route   GET /api/users
 */
exports.listUsers = async (req, res) => {
    try {
        const users = await User.find({}, 'name email role').sort({ name: 1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    List farmers (role 'user') for field staff selection
 * @route   GET /api/users/farmers
 */
exports.listFarmers = async (req, res) => {
    try {
        const { search } = req.query;
        const query = { role: 'user', status: { $ne: 'deleted' } };
        if (search) {
            const regex = new RegExp(search, 'i');
            query.$or = [
                { name: { $regex: regex } },
                { email: { $regex: regex } },
                { phoneNumber: { $regex: regex } },
            ];
        }
        const farmers = await User.find(query, 'name email phoneNumber role').sort({ name: 1 }).limit(500);
        res.json(farmers);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Submit a latex sell request
 * @route   POST /api/users/submit-bill
 */
exports.submitBillRequest = async (req, res) => {
    const { latexVolume, drcPercentage, companyRate } = req.body;

    // --- Backend Validation Block ---
    if (latexVolume == null || drcPercentage == null || companyRate == null) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }
    if (typeof latexVolume !== 'number' || typeof drcPercentage !== 'number' || typeof companyRate !== 'number') {
        return res.status(400).json({ message: 'All inputs must be numbers.' });
    }
    if (latexVolume <= 0 || drcPercentage <= 0) {
        return res.status(400).json({ message: 'Volume and DRC must be greater than zero.' });
    }
    // --- End Validation Block ---

    try {
        // Correct calculation for percentage
        const calculatedAmount = latexVolume * (drcPercentage / 100) * companyRate;
        
        const newBillRequest = new BillRequest({
            supplier: req.user._id, // Get user ID from protect middleware
            latexVolume,
            drcPercentage,
            companyRate,
            calculatedAmount
        });

        const savedBill = await newBillRequest.save();
        res.status(201).json(savedBill);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Get current user's profile
 * @route   GET /api/users/profile
 */
exports.getUserProfile = (req, res) => {
    // req.user is populated by the protect middleware
    res.status(200).json(req.user);
};

/**
 * @desc    Update current user's profile (phoneNumber, location, name)
 * @route   PUT /api/users/profile
 */
exports.updateUserProfile = async (req, res) => {
    try {
        const updates = {};
        const allowed = ['name', 'phoneNumber', 'location', 'address'];
        for (const key of allowed) {
            if (typeof req.body[key] === 'string') {
                // Only add address if it's not empty or if user is explicitly updating it
                if (key === 'address') {
                    const trimmedAddress = req.body[key].trim();
                    if (trimmedAddress.length >= 10) {
                        updates[key] = trimmedAddress;
                    }
                } else {
                    updates[key] = req.body[key];
                }
            }
        }
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No valid fields to update.' });
        }

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        Object.assign(user, updates);

        // Re-validate phone number using the same schema validation
        user.markModified('phoneNumber');
        user.markModified('location');
        if (updates.address) {
            user.markModified('address');
        }

        await user.save();

        const safe = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            location: user.location,
            address: user.address,
            role: user.role,
            isPhoneVerified: user.isPhoneVerified,
        };

        return res.json({ message: 'Profile updated', user: safe });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

/**
 * @desc    Get all bill submissions for the logged-in user
 * @route   GET /api/users/my-submissions
 */
exports.getMySubmissions = async (req, res) => {
    try {
        // Find all bills where the supplier matches the logged-in user's ID
        const submissions = await BillRequest.find({ supplier: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};