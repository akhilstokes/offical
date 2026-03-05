const Expense = require('../models/expenseModel');
const User = require('../models/userModel');

// Role-based permissions
const canCreate = (role) => ['admin', 'manager', 'accountant'].includes(role);
const canEdit = (role, expense, userId) => {
    if (role === 'admin') return true;
    if (role === 'manager' && expense.createdByRole === 'manager') return true;
    if (role === 'accountant' && expense.createdBy.toString() === userId.toString()) return true;
    return false;
};
const canDelete = (role) => role === 'admin';
const canApprove = (role) => role === 'admin';

// @desc    Create new expense
// @route   POST /api/expenses
// @access  Admin, Manager, Accountant
exports.createExpense = async (req, res) => {
    try {
        console.log('📝 Create expense request received');
        console.log('User:', req.user ? req.user.email : 'NOT AUTHENTICATED');
        console.log('Body:', JSON.stringify(req.body, null, 2));

        if (!req.user) {
            console.log('❌ No user in request - authentication failed');
            return res.status(401).json({ 
                success: false,
                message: 'Authentication required' 
            });
        }

        const userRole = req.user.role;
        console.log('User role:', userRole);
        
        if (!canCreate(userRole)) {
            console.log('❌ User does not have permission');
            return res.status(403).json({ 
                success: false,
                message: 'You do not have permission to create expenses' 
            });
        }

        const expenseData = {
            ...req.body,
            createdBy: req.user._id,
            createdByRole: userRole,
            history: [{
                action: 'created',
                performedBy: req.user._id,
                performedByName: req.user.name,
                performedByRole: userRole,
                timestamp: new Date(),
                remarks: 'Expense created'
            }]
        };

        console.log('Creating expense with data:', JSON.stringify(expenseData, null, 2));

        const expense = await Expense.create(expenseData);
        console.log('✅ Expense created:', expense.expenseId);
        
        await expense.populate('createdBy', 'name email role');

        res.status(201).json({
            success: true,
            message: 'Expense created successfully',
            data: expense
        });
    } catch (error) {
        console.error('❌ Create expense error:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            success: false,
            message: 'Error creating expense', 
            error: error.message 
        });
    }
};

// @desc    Get all expenses with filters
// @route   GET /api/expenses
// @access  Admin, Manager, Accountant
exports.getAllExpenses = async (req, res) => {
    try {
        const userRole = req.user.role;
        const { 
            category, 
            status, 
            startDate, 
            endDate, 
            search,
            page = 1,
            limit = 20,
            sortBy = 'expenseDate',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        let query = { isDeleted: false };

        // Role-based filtering
        if (userRole === 'accountant') {
            query.createdBy = req.user._id;
        } else if (userRole === 'manager') {
            query.$or = [
                { createdBy: req.user._id },
                { createdByRole: 'manager' }
            ];
        }

        // Apply filters
        if (category) query.category = category;
        if (status) query.status = status;
        
        if (startDate || endDate) {
            query.expenseDate = {};
            if (startDate) query.expenseDate.$gte = new Date(startDate);
            if (endDate) query.expenseDate.$lte = new Date(endDate);
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { expenseId: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const expenses = await Expense.find(query)
            .populate('createdBy', 'name email role')
            .populate('approvedBy', 'name email role')
            .populate('lastModifiedBy', 'name email role')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Expense.countDocuments(query);

        // Calculate summary statistics
        const summary = await Expense.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    pendingAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
                        }
                    },
                    paidAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0]
                        }
                    },
                    approvedAmount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0]
                        }
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: expenses,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            },
            summary: summary[0] || {
                totalAmount: 0,
                pendingAmount: 0,
                paidAmount: 0,
                approvedAmount: 0
            }
        });
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ 
            message: 'Error fetching expenses', 
            error: error.message 
        });
    }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Admin, Manager, Accountant
exports.getExpenseById = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id)
            .populate('createdBy', 'name email role phoneNumber')
            .populate('approvedBy', 'name email role')
            .populate('lastModifiedBy', 'name email role')
            .populate('history.performedBy', 'name role')
            .populate('comments.user', 'name role');

        if (!expense || expense.isDeleted) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Check permissions
        const userRole = req.user.role;
        if (userRole === 'accountant' && expense.createdBy._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.status(200).json({
            success: true,
            data: expense
        });
    } catch (error) {
        console.error('Get expense error:', error);
        res.status(500).json({ 
            message: 'Error fetching expense', 
            error: error.message 
        });
    }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Admin, Manager (own), Accountant (own)
exports.updateExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense || expense.isDeleted) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        // Check permissions
        if (!canEdit(req.user.role, expense, req.user._id)) {
            return res.status(403).json({ 
                message: 'You do not have permission to edit this expense' 
            });
        }

        // Track changes
        const changes = {};
        Object.keys(req.body).forEach(key => {
            if (expense[key] !== req.body[key]) {
                changes[key] = { from: expense[key], to: req.body[key] };
            }
        });

        // Update fields
        Object.assign(expense, req.body);
        expense.lastModifiedBy = req.user._id;

        // Add to history
        expense.history.push({
            action: 'updated',
            performedBy: req.user._id,
            performedByName: req.user.name,
            performedByRole: req.user.role,
            timestamp: new Date(),
            changes,
            remarks: req.body.updateRemarks || 'Expense updated'
        });

        await expense.save();
        await expense.populate('createdBy approvedBy lastModifiedBy', 'name email role');

        res.status(200).json({
            success: true,
            message: 'Expense updated successfully',
            data: expense
        });
    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({ 
            message: 'Error updating expense', 
            error: error.message 
        });
    }
};

// @desc    Approve/Reject expense
// @route   PATCH /api/expenses/:id/approve
// @access  Admin only
exports.approveExpense = async (req, res) => {
    try {
        if (!canApprove(req.user.role)) {
            return res.status(403).json({ 
                message: 'Only admins can approve expenses' 
            });
        }

        const { action, remarks } = req.body; // action: 'approve' or 'reject'

        const expense = await Expense.findById(req.params.id);

        if (!expense || expense.isDeleted) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        if (action === 'approve') {
            expense.approvalStatus = 'approved';
            expense.status = 'approved';
            expense.approvedBy = req.user._id;
            expense.approvedAt = new Date();
        } else if (action === 'reject') {
            expense.approvalStatus = 'rejected';
            expense.status = 'rejected';
        }

        expense.history.push({
            action: action === 'approve' ? 'approved' : 'rejected',
            performedBy: req.user._id,
            performedByName: req.user.name,
            performedByRole: req.user.role,
            timestamp: new Date(),
            remarks: remarks || `Expense ${action}d by admin`
        });

        await expense.save();
        await expense.populate('createdBy approvedBy', 'name email role');

        res.status(200).json({
            success: true,
            message: `Expense ${action}d successfully`,
            data: expense
        });
    } catch (error) {
        console.error('Approve expense error:', error);
        res.status(500).json({ 
            message: 'Error processing approval', 
            error: error.message 
        });
    }
};

// @desc    Mark expense as paid
// @route   PATCH /api/expenses/:id/pay
// @access  Admin, Accountant
exports.markAsPaid = async (req, res) => {
    try {
        const { paidDate, transactionId, paymentMethod, remarks } = req.body;

        const expense = await Expense.findById(req.params.id);

        if (!expense || expense.isDeleted) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        expense.status = 'paid';
        expense.paidDate = paidDate || new Date();
        if (transactionId) expense.transactionId = transactionId;
        if (paymentMethod) expense.paymentMethod = paymentMethod;

        expense.history.push({
            action: 'paid',
            performedBy: req.user._id,
            performedByName: req.user.name,
            performedByRole: req.user.role,
            timestamp: new Date(),
            remarks: remarks || 'Payment completed'
        });

        await expense.save();
        await expense.populate('createdBy approvedBy', 'name email role');

        res.status(200).json({
            success: true,
            message: 'Expense marked as paid',
            data: expense
        });
    } catch (error) {
        console.error('Mark paid error:', error);
        res.status(500).json({ 
            message: 'Error marking expense as paid', 
            error: error.message 
        });
    }
};

// @desc    Delete expense (soft delete)
// @route   DELETE /api/expenses/:id
// @access  Admin only
exports.deleteExpense = async (req, res) => {
    try {
        if (!canDelete(req.user.role)) {
            return res.status(403).json({ 
                message: 'Only admins can delete expenses' 
            });
        }

        const expense = await Expense.findById(req.params.id);

        if (!expense || expense.isDeleted) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        expense.isDeleted = true;
        expense.deletedAt = new Date();
        expense.deletedBy = req.user._id;

        expense.history.push({
            action: 'cancelled',
            performedBy: req.user._id,
            performedByName: req.user.name,
            performedByRole: req.user.role,
            timestamp: new Date(),
            remarks: req.body.remarks || 'Expense deleted'
        });

        await expense.save();

        res.status(200).json({
            success: true,
            message: 'Expense deleted successfully'
        });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ 
            message: 'Error deleting expense', 
            error: error.message 
        });
    }
};

// @desc    Add comment to expense
// @route   POST /api/expenses/:id/comments
// @access  Admin, Manager, Accountant
exports.addComment = async (req, res) => {
    try {
        const { comment } = req.body;

        const expense = await Expense.findById(req.params.id);

        if (!expense || expense.isDeleted) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        expense.comments.push({
            user: req.user._id,
            userName: req.user.name,
            userRole: req.user.role,
            comment,
            timestamp: new Date()
        });

        await expense.save();
        await expense.populate('comments.user', 'name role');

        res.status(200).json({
            success: true,
            message: 'Comment added successfully',
            data: expense.comments
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ 
            message: 'Error adding comment', 
            error: error.message 
        });
    }
};

// @desc    Get expense statistics
// @route   GET /api/expenses/stats
// @access  Admin, Manager
exports.getExpenseStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter.expenseDate = {};
            if (startDate) dateFilter.expenseDate.$gte = new Date(startDate);
            if (endDate) dateFilter.expenseDate.$lte = new Date(endDate);
        }

        const stats = await Expense.aggregate([
            { $match: { isDeleted: false, ...dateFilter } },
            {
                $facet: {
                    byCategory: [
                        {
                            $group: {
                                _id: '$category',
                                total: { $sum: '$amount' },
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    byStatus: [
                        {
                            $group: {
                                _id: '$status',
                                total: { $sum: '$amount' },
                                count: { $sum: 1 }
                            }
                        }
                    ],
                    overall: [
                        {
                            $group: {
                                _id: null,
                                totalExpenses: { $sum: '$amount' },
                                totalCount: { $sum: 1 },
                                avgExpense: { $avg: '$amount' }
                            }
                        }
                    ]
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ 
            message: 'Error fetching statistics', 
            error: error.message 
        });
    }
};
