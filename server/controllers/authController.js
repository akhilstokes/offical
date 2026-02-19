const User = require('../models/userModel');
const Worker = require('../models/workerModel');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Initialize the Google Auth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to generate your app's token
const generateToken = (id, role) => {
    const jwtSecret = process.env.JWT_SECRET || 'dev_insecure_jwt_secret_change_me';
    if (!process.env.JWT_SECRET) {
        // eslint-disable-next-line no-console
        console.warn('[auth] JWT_SECRET is not set. Using an insecure development fallback.');
    }
    return jwt.sign({ id, role }, jwtSecret, {
        expiresIn: '30d',
    });
};

// --- Register a new user ---
exports.register = async (req, res) => {
	const { name, email, phoneNumber } = req.body;
	const passwordValue = req.body && req.body.password;
    try {
		if (!passwordValue) {
			return res.status(400).json({ message: 'Password is required' });
		}
        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Validate and clean phone number before creating user
        if (!phoneNumber) {
            return res.status(400).json({ message: 'Phone number is required' });
        }
        const phoneStr = String(phoneNumber);
        const cleanPhoneNumber = phoneStr.replace(/\D/g, '');
        const finalPhoneNumber = cleanPhoneNumber.startsWith('91') && cleanPhoneNumber.length === 12 
            ? cleanPhoneNumber.substring(2) 
            : cleanPhoneNumber.startsWith('0') 
                ? cleanPhoneNumber.substring(1) 
                : cleanPhoneNumber;

		const user = await User.create({ 
            name, 
            email, 
            phoneNumber: finalPhoneNumber, 
			password: passwordValue 
        });

        if (user) {
            // Send welcome email (non-blocking)
            try {
                await sendEmail({
                    email: user.email,
                    subject: 'Welcome to Holy Family Polymers!',
                    message: `Hi ${user.name},\n\nThank you for registering with Holy Family Polymers. We are excited to have you with us.\n\nBest regards,\nThe Holy Family Polymers Team`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #333;">Welcome to Holy Family Polymers!</h2>
                            <p>Hi ${user.name},</p>
                            <p>Thank you for registering with Holy Family Polymers. We are excited to have you with us.</p>
                            <p>Your account has been successfully created and you can now log in to access our services.</p>
                            <p>Best regards,<br>The Holy Family Polymers Team</p>
                        </div>
                    `
                });
                console.log('Welcome email sent successfully to:', user.email);
            } catch (emailError) {
                console.error('Welcome email could not be sent:', emailError);
            }

            const token = generateToken(user._id, user.role);
            res.status(201).json({
                token,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Registration error:', error);

        if (error.name === 'ValidationError') {
            const validationErrors = {};
            Object.keys(error.errors).forEach(key => {
                validationErrors[key] = error.errors[key].message;
            });
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: validationErrors 
            });
        }
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'User with this email already exists' 
            });
        }
        
        res.status(500).json({ message: error.message });
    }
};

// --- Register a new buyer ---
exports.registerBuyer = async (req, res) => {
	const { name, email, phoneNumber } = req.body;
	const passwordValue = req.body && req.body.password;
    try {
		if (!passwordValue) {
			return res.status(400).json({ message: 'Password is required' });
		}
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
        const finalPhoneNumber = cleanPhoneNumber.startsWith('91') && cleanPhoneNumber.length === 12 
            ? cleanPhoneNumber.substring(2) 
            : cleanPhoneNumber.startsWith('0') 
                ? cleanPhoneNumber.substring(1) 
                : cleanPhoneNumber;

		const user = await User.create({ 
            name, 
            email, 
            phoneNumber: finalPhoneNumber, 
			password: passwordValue,
            role: 'buyer'
        });

        try {
            await sendEmail({
                email: user.email,
                subject: 'Welcome Buyer - Holy Family Polymers',
                message: `Hi ${user.name}, welcome to the Holy Family Polymers Store.`,
                html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Welcome to the Store!</h2>
                        <p>Hi ${user.name}, your buyer account is ready.</p>
                      </div>`
            });
        } catch (e) {
            console.warn('Buyer welcome email failed:', e.message);
        }

        const token = generateToken(user._id, user.role);
        res.status(201).json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Buyer registration error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Generate a unique Staff ID: "HF" + 3 random alphanumeric chars (e.g., HF9A2)
const generateRandomStaffId = async () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const pick = () => alphabet[Math.floor(Math.random() * alphabet.length)];
    // Loop until a unique ID is found (collision chance is low with 36^3=46656)
    for (let attempt = 0; attempt < 50; attempt++) {
        const candidate = `HF${pick()}${pick()}${pick()}`;
        // Ensure uniqueness
        // eslint-disable-next-line no-await-in-loop
        const exists = await User.findOne({ staffId: candidate }).lean();
        if (!exists) return candidate;
    }
    throw new Error('Failed to generate unique Staff ID');
};

// --- Register a new staff member ---
exports.registerStaff = async (req, res) => {
    const { name, email, phoneNumber, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
        const finalPhoneNumber = cleanPhoneNumber.startsWith('91') && cleanPhoneNumber.length === 12 
            ? cleanPhoneNumber.substring(2) 
            : cleanPhoneNumber.startsWith('0') 
                ? cleanPhoneNumber.substring(1) 
                : cleanPhoneNumber;
        // Generate new Staff ID in required format
        const staffId = await generateRandomStaffId();

        // Create staff with initial password set to staffId for convenience (though login uses Staff ID only)
        const user = new User({ 
            name, 
            email, 
            phoneNumber: finalPhoneNumber, 
            password: staffId,
            role: 'field_staff',
            staffId
        });
        // Allow staff to bypass strict password validator as per schema
        await user.save({ validateBeforeSave: false });

        // Email the Staff ID to the staff member
        try {
            await sendEmail({
                email: user.email,
                subject: 'Your Staff ID - Holy Family Polymers',
                message: `Hello ${user.name}, Your Staff ID is ${staffId}. Use this Staff ID to log in to the staff portal.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
                        <h2 style="color:#0B6E4F;">Welcome to Holy Family Polymers</h2>
                        <p>Hello ${user.name},</p>
                        <p>Your Staff ID is <strong>${staffId}</strong>.</p>
                        <p>Use your <strong>Staff ID</strong> to log in to the staff portal.</p>
                    </div>
                `
            });
        } catch (emailErr) {
            console.warn('Failed to send staff ID email:', emailErr.message);
        }

        const token = generateToken(user._id, user.role);
        res.status(201).json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                staffId: user.staffId,
            },
        });
    } catch (error) {
        console.error('Staff registration error:', error);
        if (error.name === 'ValidationError') {
            const validationErrors = {};
            Object.keys(error.errors).forEach(key => {
                validationErrors[key] = error.errors[key].message;
            });
            return res.status(400).json({ 
                message: 'Validation failed', 
                errors: validationErrors 
            });
        }
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: 'User with this email already exists' 
            });
        }
        res.status(500).json({ message: error.message });
    }
};

// --- Get a sample staff ID (preview before registration) ---
exports.getNextStaffId = async (req, res) => {
    try {
        const staffId = await generateRandomStaffId();
        res.status(200).json({ staffId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Log in an existing user ---
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Built-in admin fallback (no registration required)
        const defaultAdminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@xyz.com').toLowerCase();
        const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin@123';
        const incomingEmail = String(email || '').trim().toLowerCase();
        if (incomingEmail === defaultAdminEmail && password === defaultAdminPassword) {
            const token = generateToken('builtin-admin', 'admin');
            return res.json({
                token,
                user: {
                    _id: 'builtin-admin',
                    name: 'Admin',
                    email: defaultAdminEmail,
                    role: 'admin',
                },
            });
        }
        // Built-in manager fallback (no registration required)
        const defaultManagerEmail = (process.env.DEFAULT_MANAGER_EMAIL || 'manger@xyz.com').toLowerCase();
        const defaultManagerPassword = process.env.DEFAULT_MANAGER_PASSWORD || 'manger@123';
        if (incomingEmail === defaultManagerEmail && password === defaultManagerPassword) {
            const token = generateToken('builtin-manager', 'manager');
            return res.json({
                token,
                user: {
                    _id: 'builtin-manager',
                    name: 'Manager',
                    email: defaultManagerEmail,
                    role: 'manager',
                },
            });
        }
        // Built-in delivery staff fallback (no registration required)
        const defaultDeliveryEmail = (process.env.DEFAULT_DELIVERY_EMAIL || 'Delivery@xyz.com').toLowerCase();
        const defaultDeliveryPassword = process.env.DEFAULT_DELIVERY_PASSWORD || 'Delivery@123';
        if (incomingEmail === defaultDeliveryEmail && password === defaultDeliveryPassword) {
            const token = generateToken('builtin-delivery', 'delivery_staff');
            return res.json({
                token,
                user: {
                    _id: 'builtin-delivery',
                    name: 'Delivery Staff',
                    email: defaultDeliveryEmail,
                    role: 'delivery_staff',
                },
            });
        }

        // Built-in accountant fallback (no registration required)
        const defaultAccountantEmail = (process.env.DEFAULT_ACCOUNTANT_EMAIL || 'Accountant@xyz.com').toLowerCase();
        const defaultAccountantPassword = process.env.DEFAULT_ACCOUNTANT_PASSWORD || 'Accountant@123';
        // Debug logs to help diagnose environment/config issues (remove in production)
        try {
            console.log('[login] incomingEmail=', incomingEmail, 'acctEmail=', defaultAccountantEmail);
        } catch {}
        if (incomingEmail === defaultAccountantEmail && password === defaultAccountantPassword) {
            const token = generateToken('builtin-accountant', 'accountant');
            try { console.log('[login] matched builtin accountant'); } catch {}
            return res.json({
                token,
                user: {
                    _id: 'builtin-accountant',
                    name: 'Accountant',
                    email: defaultAccountantEmail,
                    role: 'accountant',
                },
            });
        }
        
        // Normal user login via DB
        const user = await User.findOne({ email }).select('+password');
        if (user && (await user.matchPassword(password))) {
            const token = generateToken(user._id, user.role);
            res.json({
                token,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: error.message });
    }
};

// --- Staff Login using Staff ID and password ---
exports.staffLogin = async (req, res) => {
    const { staffId } = req.body;
    try {
        if (!staffId) {
            return res.status(400).json({ message: 'Staff ID is required' });
        }
        // Normalize incoming ID: trim spaces, uppercase, collapse multiple spaces, allow hyphenated legacy forms
        const raw = String(staffId || '');
        const normalized = raw.trim().toUpperCase();

        // Built-in default delivery staff login (no DB required)
        const defaultDeliveryId = (process.env.DEFAULT_DELIVERY_STAFF_ID || 'STF-0000-001').toUpperCase();
        const defaultDeliveryAlnum = defaultDeliveryId.replace(/[^A-Z0-9]/g, '');
        if (normalized === defaultDeliveryId || normalized.replace(/[^A-Z0-9]/g,'') === defaultDeliveryAlnum) {
            const token = generateToken('builtin-delivery', 'delivery_staff');
            return res.json({
                token,
                user: {
                    _id: 'builtin-delivery',
                    name: 'Delivery Staff',
                    email: process.env.DEFAULT_DELIVERY_STAFF_EMAIL || 'delivery@hfp.local',
                    role: 'delivery_staff',
                    staffId: defaultDeliveryId,
                }
            });
        }

        // Build candidate variants
        const alnum = normalized.replace(/[^A-Z0-9]/g, '');
        const candidates = Array.from(new Set([normalized, alnum])).filter(Boolean);
        const regexes = candidates.map(c => new RegExp(`^${c}$`, 'i'));

        // Debug: trace lookup
        console.log('[staffLogin] incoming:', raw, 'normalized:', normalized, 'candidates:', candidates);

        // Try to find by any candidate (exact or case-insensitive) in Users
        let user = await User.findOne({
            $or: [
                { staffId: { $in: candidates } },
                ...regexes.map(r => ({ staffId: r }))
            ]
        }).select('+password');

        // If user not found, attempt lookup in Worker and use its linked user
        if (!user) {
            const worker = await Worker.findOne({
                $or: [
                    { staffId: { $in: candidates } },
                    ...regexes.map(r => ({ staffId: r }))
                ]
            }).lean();
            if (worker && worker.user) {
                user = await User.findById(worker.user).select('+password');
                // If linked user exists but lacks staffId, sync it for future direct logins
                if (user && !user.staffId) {
                    try { await User.updateOne({ _id: user._id }, { $set: { staffId: worker.staffId } }); } catch {}
                }
            } else if (worker && !worker.user) {
                return res.status(401).json({ message: 'Staff found but not activated for login. Please approve/link this staff user in Admin.' });
            }
        }
        if (!user) {
            return res.status(401).json({ message: 'Invalid Staff ID' });
        }
        // Role guard: allow field_staff and delivery_staff to access staff portal
        if (!(user.role === 'field_staff' || user.role === 'delivery_staff')) {
            console.log('[staffLogin] role mismatch for', user.staffId, 'role:', user.role);
            return res.status(403).json({ message: 'This Staff ID is not permitted for staff portal' });
        }
        console.log('[staffLogin] success for', user.staffId, 'role:', user.role, 'userId:', String(user._id));
        const token = generateToken(user._id, user.role);
        res.json({
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                staffId: user.staffId,
            },
        });
    } catch (error) {
        console.error('Staff login error:', error);
        res.status(500).json({ message: error.message });
    }
};

// --- Google Sign-In function ---
exports.googleSignIn = async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { name, email } = ticket.getPayload();
        let user = await User.findOne({ email });
        if (!user) {
            const password = crypto.randomBytes(16).toString('hex');
            user = new User({ name, email, password, phoneNumber: 'N/A' });
            await user.save({ validateBeforeSave: false });
        }
        const appToken = generateToken(user._id, user.role);
        res.status(200).json({
            token: appToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    } catch (error) {
        console.error('Google sign-in error:', error);
        res.status(400).json({ message: 'Google Sign-In failed. Invalid token.' });
    }
};

// --- Forgot Password function ---
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User with that email does not exist.' });
        }
        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
        
        const htmlMessage = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p>You requested a password reset for your Holy Family Polymers account.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                </div>
                <p>This link will expire in 10 minutes.</p>
                <p>If you did not request this, please ignore this email.</p>
            </div>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password Reset Request - Holy Family Polymers',
                message: `Reset your password: ${resetUrl}`,
                html: htmlMessage
            });
            console.log('Password reset email sent to:', user.email);
            res.status(200).json({ message: 'Password reset link sent to your email.' });
        } catch (emailError) {
            console.error('Password reset email error:', emailError);
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
            res.status(500).json({ message: 'Email could not be sent. Please try again later.' });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: error.message });
    }
};

// --- Reset Password function ---
exports.resetPassword = async (req, res) => {
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
    try {
        const user = await User.findOne({
            passwordResetToken: resetPasswordToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }

        if (!req.body.password) {
            return res.status(400).json({ message: 'Password is required.' });
        }

        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successful.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: error.message });
    }
};

// --- Validate token ---
exports.validateToken = async (req, res) => {
    try {
        // The token is already validated by the protect middleware
        // We just need to return the user info
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                valid: false, 
                message: 'User not found' 
            });
        }

        res.json({
            valid: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isPhoneVerified: user.isPhoneVerified,
                accountHolderName: user.accountHolderName,
                accountNumber: user.accountNumber,
                ifscCode: user.ifscCode,
                bankName: user.bankName,
                branchName: user.branchName
            }
        });
    } catch (error) {
        console.error('Token validation error:', error);
        res.status(401).json({ 
            valid: false, 
            message: 'Invalid token' 
        });
    }
};

// --- Check if user registration is complete ---
exports.checkRegistrationStatus = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                message: 'User not found' 
            });
        }

        // Check if all required fields are filled
        // Since user can login, password exists, so we only need to check other fields
        const isComplete = user.name && user.email && user.phoneNumber;
        
        res.json({
            isComplete,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isPhoneVerified: user.isPhoneVerified,
                hasPhone: !!user.phoneNumber,
                accountHolderName: user.accountHolderName,
                accountNumber: user.accountNumber,
                ifscCode: user.ifscCode,
                bankName: user.bankName,
                branchName: user.branchName
            }
        });
    } catch (error) {
        console.error('Registration status check error:', error);
        res.status(500).json({ 
            message: 'Error checking registration status' 
        });
    }
};
