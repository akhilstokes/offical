const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    // Basic Information
    expenseId: {
        type: String,
        trim: true,
        sparse: true
        // Not required - will be auto-generated in pre-save hook
        // Sparse index allows multiple null values
    },
    
    title: {
        type: String,
        required: [true, 'Expense title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    
    // Category and Type
    category: {
        type: String,
        enum: ['bills', 'other_expenses', 'utilities', 'maintenance', 'supplies', 'transport', 'salaries', 'miscellaneous'],
        required: [true, 'Category is required'],
        default: 'other_expenses'
    },
    
    subcategory: {
        type: String,
        trim: true,
        maxlength: 100
    },
    
    // Items (for itemized expenses)
    items: [{
        name: {
            type: String,
            trim: true,
            maxlength: 200
        },
        rate: {
            type: Number,
            min: 0
        },
        quantity: {
            type: Number,
            min: 1,
            default: 1
        }
    }],
    
    // GST Information
    gstEnabled: {
        type: Boolean,
        default: false
    },
    
    gstAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    
    totalAmount: {
        type: Number,
        min: 0
    },
    
    // Financial Details
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    
    currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR']
    },
    
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank_transfer', 'cheque', 'upi', 'card', 'other'],
        default: 'cash'
    },
    
    transactionId: {
        type: String,
        trim: true
    },
    
    // Date Information
    expenseDate: {
        type: Date,
        required: [true, 'Expense date is required'],
        default: Date.now
    },
    
    dueDate: {
        type: Date
    },
    
    paidDate: {
        type: Date
    },
    
    // Status and Approval
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'paid', 'cancelled'],
        default: 'pending'
    },
    
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    
    // User Tracking
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    createdByRole: {
        type: String,
        enum: ['admin', 'manager', 'accountant'],
        required: true
    },
    
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    approvedAt: {
        type: Date
    },
    
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Vendor/Payee Information
    vendor: {
        name: {
            type: String,
            trim: true,
            maxlength: 200
        },
        contact: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        },
        address: {
            type: String,
            trim: true
        }
    },
    
    // Attachments
    attachments: [{
        filename: String,
        url: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Notes and Comments
    notes: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        userName: String,
        userRole: String,
        comment: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Audit Trail
    history: [{
        action: {
            type: String,
            enum: ['created', 'updated', 'approved', 'rejected', 'paid', 'cancelled']
        },
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        performedByName: String,
        performedByRole: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        changes: mongoose.Schema.Types.Mixed,
        remarks: String
    }],
    
    // Recurring Expense
    isRecurring: {
        type: Boolean,
        default: false
    },
    
    recurringFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
        required: false
        // Don't set default to null - leave undefined if not recurring
    },
    
    // Tags for filtering
    tags: [String],
    
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

// Indexes for performance
expenseSchema.index({ expenseId: 1 }, { unique: true, sparse: true }); // Sparse allows multiple nulls
expenseSchema.index({ createdBy: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ isDeleted: 1 });

// Auto-generate expense ID
expenseSchema.pre('save', async function(next) {
    if (!this.expenseId) {
        const count = await mongoose.model('Expense').countDocuments();
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        this.expenseId = `EXP${year}${month}${(count + 1).toString().padStart(5, '0')}`;
    }
    next();
});

// Virtual for days overdue
expenseSchema.virtual('daysOverdue').get(function() {
    if (this.dueDate && this.status !== 'paid' && new Date() > this.dueDate) {
        return Math.floor((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
    }
    return 0;
});

module.exports = mongoose.model('Expense', expenseSchema);
