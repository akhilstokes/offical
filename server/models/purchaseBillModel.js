const mongoose = require('mongoose');

const purchaseBillSchema = new mongoose.Schema({
    // Bill Information
    billNumber: {
        type: String,
        unique: true,
        trim: true
        // Auto-generated in pre-save hook
    },
    
    billDate: {
        type: Date,
        required: [true, 'Bill date is required'],
        default: Date.now
    },
    
    dueDate: {
        type: Date,
        required: [true, 'Due date is required']
    },
    
    purchaseOrderNumber: {
        type: String,
        trim: true
    },
    
    placeOfSupply: {
        type: String,
        required: [true, 'Place of supply is required'],
        trim: true
    },
    
    paymentTerms: {
        type: String,
        enum: ['immediate', 'net_15', 'net_30', 'net_45', 'net_60', 'custom'],
        default: 'net_30'
    },
    
    // Supplier Information
    supplier: {
        name: {
            type: String,
            required: [true, 'Supplier name is required'],
            trim: true
        },
        mobile: {
            type: String,
            trim: true,
            match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number']
        },
        gstin: {
            type: String,
            trim: true,
            uppercase: true,
            match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GSTIN']
        },
        billingAddress: {
            type: String,
            trim: true
        },
        state: {
            type: String,
            trim: true
        }
    },
    
    // Items
    items: [{
        itemName: {
            type: String,
            required: [true, 'Item name is required'],
            trim: true
        },
        hsnCode: {
            type: String,
            trim: true
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [0.001, 'Quantity must be greater than 0']
        },
        unit: {
            type: String,
            default: 'KG',
            enum: ['KG', 'LITRE', 'PIECE', 'BOX', 'METER', 'TON']
        },
        rate: {
            type: Number,
            required: [true, 'Rate is required'],
            min: [0, 'Rate cannot be negative']
        },
        gstRate: {
            type: Number,
            required: [true, 'GST rate is required'],
            enum: [0, 5, 12, 18, 28],
            default: 18
        },
        amount: {
            type: Number,
            required: true
        }
    }],
    
    // Bill Summary
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    
    cgst: {
        type: Number,
        default: 0,
        min: 0
    },
    
    sgst: {
        type: Number,
        default: 0,
        min: 0
    },
    
    igst: {
        type: Number,
        default: 0,
        min: 0
    },
    
    transportationCharges: {
        type: Number,
        default: 0,
        min: 0
    },
    
    otherCharges: {
        type: Number,
        default: 0,
        min: 0
    },
    
    roundOff: {
        type: Number,
        default: 0
    },
    
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    
    // Payment Information
    paymentStatus: {
        type: String,
        enum: ['paid', 'partial', 'unpaid'],
        default: 'unpaid'
    },
    
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank', 'upi', 'cheque', 'other'],
        default: 'bank'
    },
    
    amountPaid: {
        type: Number,
        default: 0,
        min: 0
    },
    
    balanceAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Additional Information
    supplierInvoice: {
        filename: String,
        url: String,
        uploadedAt: Date
    },
    
    internalNotes: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    
    termsAndConditions: {
        type: String,
        trim: true,
        maxlength: 2000
    },
    
    // User Tracking
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    createdByRole: {
        type: String,
        enum: ['admin', 'accountant'],
        required: true
    },
    
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Status
    status: {
        type: String,
        enum: ['draft', 'submitted', 'approved', 'cancelled'],
        default: 'submitted'
    },
    
    // Audit Trail
    history: [{
        action: String,
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        performedByName: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        remarks: String
    }],
    
    // Soft Delete
    isDeleted: {
        type: Boolean,
        default: false
    },
    
    deletedAt: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
    
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
purchaseBillSchema.index({ billNumber: 1 });
purchaseBillSchema.index({ 'supplier.name': 1 });
purchaseBillSchema.index({ billDate: -1 });
purchaseBillSchema.index({ paymentStatus: 1 });
purchaseBillSchema.index({ isDeleted: 1 });

// Auto-generate bill number: Format PURCHASE/2026/00001
purchaseBillSchema.pre('save', async function(next) {
    if (!this.billNumber) {
        const date = new Date();
        const year = date.getFullYear();
        
        // Count bills for current year
        const startOfYear = new Date(year, 0, 1);
        const endOfYear = new Date(year, 11, 31, 23, 59, 59);
        
        const count = await mongoose.model('PurchaseBill').countDocuments({
            createdAt: { $gte: startOfYear, $lte: endOfYear }
        });
        
        this.billNumber = `PURCHASE/${year}/${(count + 1).toString().padStart(5, '0')}`;
    }
    
    // Calculate balance amount
    this.balanceAmount = this.totalAmount - this.amountPaid;
    
    // Update payment status based on amounts
    if (this.amountPaid === 0) {
        this.paymentStatus = 'unpaid';
    } else if (this.amountPaid >= this.totalAmount) {
        this.paymentStatus = 'paid';
    } else {
        this.paymentStatus = 'partial';
    }
    
    next();
});

// Virtual for days overdue
purchaseBillSchema.virtual('daysOverdue').get(function() {
    if (this.dueDate && this.paymentStatus !== 'paid' && new Date() > this.dueDate) {
        return Math.floor((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
    }
    return 0;
});

module.exports = mongoose.model('PurchaseBill', purchaseBillSchema);
