const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide your name."],
        trim: true,
        minlength: [2, "Name must be at least 2 characters long."],
        maxlength: [50, "Name must be less than 50 characters."],
        validate: {
            validator: function (name) {
                // Only letters, spaces, and dots allowed
                return /^[a-zA-Z\s.]+$/.test(name);
            },
            message: "Name must contain only letters, spaces, and dots (no numbers or special characters)."
        }
    },

    email: {
        type: String,
        required: [true, "Please provide an email."],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            "Please provide a valid email address."
        ]
    },

    phoneNumber: {
        type: String,
        required: [true, "Please provide a phone number."],
        trim: true,
        validate: {
            validator: function (phone) {
                const cleanPhone = phone.replace(/\D/g, ''); // remove non-digits

                // Reject all zeros
                if (/^0+$/.test(cleanPhone)) return false;

                // +91 with country code
                if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
                    return /^[6-9]\d{9}$/.test(cleanPhone.substring(2));
                }

                // 10-digit number without country code
                if (cleanPhone.length === 10) {
                    return /^[6-9]\d{9}$/.test(cleanPhone);
                }

                // Number with leading 0
                if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
                    return /^[6-9]\d{9}$/.test(cleanPhone.substring(1));
                }

                return false;
            },
            message: "Please provide a valid 10-digit Indian mobile number (can include +91 country code)."
        }
    },

    location: {
        type: String,
        trim: true,
        maxlength: 100,
        default: ''
    },

    address: {
        type: String,
        required: false,
        trim: true,
        maxlength: 500,
        default: '',
        validate: {
            validator: function (address) {
                // If address is provided, it must be at least 10 characters
                // If empty or not provided, that's okay for existing users
                if (!address || address.trim().length === 0) {
                    return true; // Allow empty for existing users
                }
                return address.trim().length >= 10;
            },
            message: "Address must be at least 10 characters long when provided."
        }
    },

    password: {
        type: String,
        required: [true, "Please provide a password."],
        minlength: [6, "Password must be at least 6 characters long."],
        select: false,
        validate: {
            validator: function (password) {
                // Allow field staff and pre-hashed (bcrypt) passwords during programmatic creation
                if (this && (this.role === 'staff' || this.role === 'field_staff' || this.role === 'lab')) return true;
                if (typeof password === 'string' && password.startsWith('$2')) return true; // bcrypt hash

                if (password.includes(' ')) return false; // no spaces
                if (!/(?=.*[A-Z])/.test(password)) return false; // uppercase
                if (!/(?=.*[a-z])/.test(password)) return false; // lowercase
                if (!/(?=.*\d)/.test(password)) return false; // number
                if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) return false; // special char
                if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(password)) return false; // valid chars only

                return true;
            },
            message: "Password must contain uppercase, lowercase, number, special character, and no spaces."
        }
    },

    role: {
        type: String,
        enum: ['user', 'admin', 'manager', 'accountant', 'field_staff', 'delivery_staff', 'lab', 'lab_manager', 'lab_staff'],
        default: 'user'
    },

    staffId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        validate: {
            validator: function (staffId) {
                if (!staffId) return true; // allow empty if not staff
                return /^[A-Z0-9]{5,12}$/.test(staffId);
            },
            message: "Staff ID must be 5-12 characters long and contain only uppercase letters and numbers."
        }
    },

    status: {
        type: String,
        enum: ['active', 'pending', 'suspended', 'deleted'],
        default: 'active'
    },

    statusReason: { type: String, default: '' },
    statusUpdatedAt: Date,
    statusUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    roleUpdatedAt: Date,
    roleUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    isPhoneVerified: {
        type: Boolean,
        default: false
    },

    passwordResetToken: String,
    passwordResetExpires: Date

    ,
    // Per-user sell barrels allowance (0 or undefined means unlimited)
    sellAllowance: { type: Number, default: 0, min: 0 },
    sellAllowanceUpdatedAt: Date,
    sellAllowanceSetBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Assigned shift for staff members
    assignedShift: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Shift' 
    },

    // RFID UID for attendance tracking
    rfidUid: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        uppercase: true
    },

    // Salary Configuration
    salaryType: {
        type: String,
        enum: ['daily', 'monthly', 'weekly'],
        default: 'daily'
    },
    baseSalary: {
        type: Number,
        default: 0,
        min: 0
    },
    dailySalary: {
        type: Number,
        default: null,
        min: 0
    },
    // Additional salary components
    allowances: {
        type: Number,
        default: 0,
        min: 0
    },
    overtime: {
        type: Number,
        default: 0,
        min: 0
    },
    bonus: {
        type: Number,
        default: 0,
        min: 0
    },
    // Deduction components
    insurance: {
        type: Number,
        default: 0,
        min: 0
    },
    loanDeduction: {
        type: Number,
        default: 0,
        min: 0
    },
    otherDeductions: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // Bank Details for Payments
    accountHolderName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifscCode: { type: String, trim: true, uppercase: true },
    bankName: { type: String, trim: true },
    branchName: { type: String, trim: true },
    
    // Digital Signature (for bills and documents)
    signatureUrl: { type: String }, // URL to uploaded signature image
    signatureUploadedAt: { type: Date }

}, { timestamps: true });

// Pre-save middleware: hash password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    // If password already appears hashed (bcrypt), keep as is
    if (typeof this.password === 'string' && this.password.startsWith('$2')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash reset password token
userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 mins

    return resetToken;
};

module.exports = mongoose.model('User', userSchema);
