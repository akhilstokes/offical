const ProductOrder = require('../models/productOrderModel');
const User = require('../models/userModel');
const Invoice = require('../models/invoiceModel');

// @desc    Create a new product order
// @route   POST /api/product-orders
// @access  Private (User)
exports.createOrder = async (req, res) => {
    console.log('📥 Incoming Create Wholesale Request:', req.body);
    try {
        const { productType, packSizeName, quantity, paymentMethod, deliveryAddress, panNumber } = req.body;

        // Validate PAN number format
        if (!panNumber) {
            return res.status(400).json({ message: 'PAN number is required for tax compliance' });
        }

        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(panNumber)) {
            return res.status(400).json({ message: 'Invalid PAN format. Please provide a valid 10-character PAN.' });
        }

        const newOrder = await ProductOrder.create({
            customerId: req.user.id || req.user._id,
            productType,
            packSizeName,
            quantity,
            paymentMethod,
            deliveryAddress,
            panNumber,
            status: 'REQUESTED'
        });

        res.status(201).json({
            message: 'Wholesale request submitted successfully. Waiting for accountant quote.',
            order: newOrder
        });
    } catch (error) {
        console.error('Error creating wholesale request:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all product orders for the logged-in user
// @route   GET /api/product-orders/my-orders
// @access  Private (User)
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await ProductOrder.find({ customerId: req.user.id || req.user._id })
            .sort({ requestedAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all product orders (Manager/Accountant)
// @route   GET /api/product-orders
// @access  Private (Manager/Accountant)
exports.getAllOrders = async (req, res) => {
    console.log('📋 Fetching all orders for manager/accountant');
    try {
        const orders = await ProductOrder.find()
            .populate('customerId', 'name phone email')
            .populate('assignedDeliveryStaffId', 'name phone')
            .populate('invoiceId', 'invoiceNumber totalAmount status')
            .sort({ requestedAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching all product orders:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Assign delivery staff to order
// @route   PUT /api/product-orders/:id/assign
// @access  Private (Manager)
exports.assignStaff = async (req, res) => {
    try {
        const { staffId } = req.body;

        // Verify staff exists and is indeed a delivery staff
        const staff = await User.findById(staffId);
        if (!staff || staff.role !== 'delivery_staff') {
            return res.status(400).json({ message: 'Invalid staff ID or not a delivery staff' });
        }

        const order = await ProductOrder.findByIdAndUpdate(
            req.params.id,
            {
                assignedDeliveryStaffId: staffId,
                status: 'DELIVERY_ASSIGNED',
                assignedAt: Date.now()
            },
            { new: true }
        ).populate('assignedDeliveryStaffId', 'name phone')
            .populate('customerId', 'name phone');

        if (!order) return res.status(404).json({ message: 'Order not found' });

        res.json(order);
    } catch (error) {
        console.error('Error assigning staff:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update order billing (Accountant)
// @route   PUT /api/product-orders/:id/bill
// @access  Private (Accountant)
exports.updateOrderBilling = async (req, res) => {
    try {
        const { unitPrice, driverName, driverPhone, vehicleNumber, items } = req.body;
        const order = await ProductOrder.findById(req.params.id).populate('customerId');

        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Calculate totals
        let totalAmount = 0;
        const processedItems = items.map(item => {
            const amount = item.quantity * item.rate;
            totalAmount += amount;
            return {
                ...item,
                amount,
                taxRate: 12, // Default 12% IGST
                taxAmount: amount * 0.12
            };
        });

        const taxAmount = totalAmount * 0.12;
        const finalTotal = totalAmount + taxAmount;

        // Create a PENDING invoice
        const timestamp = Date.now();
        const invoiceNumber = `INV-WHL-${timestamp}`;

        const invoice = await Invoice.create({
            invoiceNumber,
            vendor: order.customerId?.name || 'Customer',
            customerPAN: order.panNumber, // Include PAN number from order
            invoiceDate: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            items: processedItems,
            subtotal: totalAmount,
            taxAmount,
            totalAmount: finalTotal,
            status: 'pending', // Manager must approve
            createdBy: req.user.id || req.user._id,
            placeOfSupply: order.deliveryAddress,
            driverName,
            driverPhone,
            vehicleNumber,
            vehicleType: 'Outside'
        });

        // Update Order
        order.invoiceId = invoice._id;
        order.totalAmount = finalTotal;
        order.driverName = driverName;
        order.driverPhone = driverPhone;
        order.vehicleNumber = vehicleNumber;
        order.status = 'BILLED';
        order.billedAt = Date.now();
        await order.save();

        res.json({ message: 'Bill generated and sent to manager for approval', order, invoice });
    } catch (error) {
        console.error('Error in accountant billing:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Approve wholesale order (Manager)
// @route   PUT /api/product-orders/:id/approve
// @access  Private (Manager)
exports.approveOrder = async (req, res) => {
    try {
        const order = await ProductOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        if (order.status !== 'BILLED') {
            return res.status(400).json({ message: 'Order must be BILLED before approval' });
        }

        order.status = 'APPROVED';
        await order.save();

        // Approve the associated invoice
        if (order.invoiceId) {
            await Invoice.findByIdAndUpdate(order.invoiceId, {
                status: 'approved',
                approvedBy: req.user.id || req.user._id,
                approvedDate: Date.now()
            });
        }

        res.json({ message: 'Order approved and bill sent to user', order });
    } catch (error) {
        console.error('Error approving order:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete wholesale request (Manager)
// @route   DELETE /api/product-orders/:id
// @access  Private (Manager)
exports.deleteOrder = async (req, res) => {
    try {
        const order = await ProductOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Delete associated invoice if any
        if (order.invoiceId) {
            await Invoice.findByIdAndDelete(order.invoiceId);
        }

        await ProductOrder.findByIdAndDelete(req.params.id);
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};
