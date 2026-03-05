const PurchaseBill = require('../models/purchaseBillModel');

// Helper function to calculate bill totals
const calculateBillTotals = (items, transportationCharges = 0, otherCharges = 0, supplierState, companyState) => {
    const subtotal = items.reduce((sum, item) => {
        const itemAmount = item.quantity * item.rate;
        item.amount = itemAmount;
        return sum + itemAmount;
    }, 0);
    
    const isIntraState = supplierState && companyState && 
                         supplierState.toLowerCase() === companyState.toLowerCase();
    
    let cgst = 0, sgst = 0, igst = 0;
    
    items.forEach(item => {
        const gstAmount = (item.amount * item.gstRate) / 100;
        if (isIntraState) {
            cgst += gstAmount / 2;
            sgst += gstAmount / 2;
        } else {
            igst += gstAmount;
        }
    });
    
    const totalBeforeRoundOff = subtotal + cgst + sgst + igst + transportationCharges + otherCharges;
    const roundOff = Math.round(totalBeforeRoundOff) - totalBeforeRoundOff;
    const totalAmount = Math.round(totalBeforeRoundOff);
    
    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        cgst: parseFloat(cgst.toFixed(2)),
        sgst: parseFloat(sgst.toFixed(2)),
        igst: parseFloat(igst.toFixed(2)),
        transportationCharges: parseFloat(transportationCharges.toFixed(2)),
        otherCharges: parseFloat(otherCharges.toFixed(2)),
        roundOff: parseFloat(roundOff.toFixed(2)),
        totalAmount
    };
};

// Create purchase bill
exports.createPurchaseBill = async (req, res) => {
    try {
        const { supplier, items, transportationCharges, otherCharges, placeOfSupply } = req.body;
        
        if (!supplier || !supplier.name) {
            return res.status(400).json({ success: false, message: 'Supplier name is required' });
        }
        
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one item is required' });
        }
        
        const companyState = placeOfSupply || 'Kerala';
        const totals = calculateBillTotals(items, transportationCharges || 0, otherCharges || 0, supplier.state, companyState);
        
        const purchaseBill = await PurchaseBill.create({
            ...req.body,
            ...totals,
            createdBy: req.user._id,
            createdByRole: req.user.role,
            history: [{
                action: 'created',
                performedBy: req.user._id,
                performedByName: req.user.name,
                timestamp: new Date()
            }]
        });
        
        res.status(201).json({ success: true, message: 'Purchase bill created successfully', data: purchaseBill });
    } catch (error) {
        console.error('Create purchase bill error:', error);
        res.status(500).json({ success: false, message: error.message || 'Error creating purchase bill' });
    }
};

// Get all purchase bills
exports.getPurchaseBills = async (req, res) => {
    try {
        const { supplier, paymentStatus, status, startDate, endDate, search, page = 1, limit = 20 } = req.query;
        
        const query = { isDeleted: false };
        
        if (supplier) query['supplier.name'] = { $regex: supplier, $options: 'i' };
        if (paymentStatus) query.paymentStatus = paymentStatus;
        if (status) query.status = status;
        if (startDate || endDate) {
            query.billDate = {};
            if (startDate) query.billDate.$gte = new Date(startDate);
            if (endDate) query.billDate.$lte = new Date(endDate);
        }
        if (search) {
            query.$or = [
                { billNumber: { $regex: search, $options: 'i' } },
                { 'supplier.name': { $regex: search, $options: 'i' } }
            ];
        }
        
        const bills = await PurchaseBill.find(query)
            .populate('createdBy', 'name email')
            .sort({ billDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
        
        const count = await PurchaseBill.countDocuments(query);
        
        res.json({
            success: true,
            data: bills,
            pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) }
        });
    } catch (error) {
        console.error('Get purchase bills error:', error);
        res.status(500).json({ success: false, message: 'Error fetching purchase bills' });
    }
};

// Get single purchase bill
exports.getPurchaseBill = async (req, res) => {
    try {
        const bill = await PurchaseBill.findById(req.params.id)
            .populate('createdBy', 'name email role');
        
        if (!bill || bill.isDeleted) {
            return res.status(404).json({ success: false, message: 'Purchase bill not found' });
        }
        
        res.json({ success: true, data: bill });
    } catch (error) {
        console.error('Get purchase bill error:', error);
        res.status(500).json({ success: false, message: 'Error fetching purchase bill' });
    }
};

// Update purchase bill
exports.updatePurchaseBill = async (req, res) => {
    try {
        const bill = await PurchaseBill.findById(req.params.id);
        
        if (!bill || bill.isDeleted) {
            return res.status(404).json({ success: false, message: 'Purchase bill not found' });
        }
        
        const { items, transportationCharges, otherCharges, supplier, placeOfSupply } = req.body;
        
        if (items) {
            const companyState = placeOfSupply || bill.placeOfSupply;
            const supplierState = supplier?.state || bill.supplier.state;
            const totals = calculateBillTotals(items, transportationCharges || bill.transportationCharges, otherCharges || bill.otherCharges, supplierState, companyState);
            Object.assign(bill, req.body, totals);
        } else {
            Object.assign(bill, req.body);
        }
        
        bill.lastModifiedBy = req.user._id;
        bill.history.push({
            action: 'updated',
            performedBy: req.user._id,
            performedByName: req.user.name,
            timestamp: new Date()
        });
        
        await bill.save();
        
        res.json({ success: true, message: 'Purchase bill updated successfully', data: bill });
    } catch (error) {
        console.error('Update purchase bill error:', error);
        res.status(500).json({ success: false, message: error.message || 'Error updating purchase bill' });
    }
};

// Delete purchase bill
exports.deletePurchaseBill = async (req, res) => {
    try {
        const bill = await PurchaseBill.findById(req.params.id);
        
        if (!bill || bill.isDeleted) {
            return res.status(404).json({ success: false, message: 'Purchase bill not found' });
        }
        
        bill.isDeleted = true;
        bill.deletedAt = new Date();
        bill.deletedBy = req.user._id;
        await bill.save();
        
        res.json({ success: true, message: 'Purchase bill deleted successfully' });
    } catch (error) {
        console.error('Delete purchase bill error:', error);
        res.status(500).json({ success: false, message: 'Error deleting purchase bill' });
    }
};

// Get statistics
exports.getPurchaseBillStats = async (req, res) => {
    try {
        const stats = await PurchaseBill.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: null, totalBills: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' }, totalPaid: { $sum: '$amountPaid' }, totalBalance: { $sum: '$balanceAmount' } } }
        ]);
        
        const byStatus = await PurchaseBill.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: '$paymentStatus', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }
        ]);
        
        res.json({
            success: true,
            data: { overall: stats[0] || { totalBills: 0, totalAmount: 0, totalPaid: 0, totalBalance: 0 }, byStatus }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
};
