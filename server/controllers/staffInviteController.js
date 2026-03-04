const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const StaffInvite = require('../models/staffInviteModel');
const User = require('../models/userModel');
const sendEmail = require('../utils/sendEmail');
const ActivityLogger = require('../services/activityLogger');

// Generate unique Staff ID in format STF-YYYY-###
// Checks both User and StaffInvite collections for the current year's max, then increments.
const generateStaffId = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `STF-${currentYear}-`;

  // Find the highest existing staff ID for this year across Users and pending Invites
  const [existingUser, existingInvite] = await Promise.all([
    User.findOne({ staffId: { $regex: `^${prefix}` } }).sort({ staffId: -1 }).lean(),
    StaffInvite.findOne({ staffId: { $regex: `^${prefix}` } }).sort({ staffId: -1 }).lean()
  ]);

  const extractNum = (sid) => {
    const parts = (sid || '').split('-');
    const n = parseInt(parts[2], 10);
    return Number.isFinite(n) ? n : 0;
  };

  const maxNum = Math.max(extractNum(existingUser?.staffId), extractNum(existingInvite?.staffId));
  const nextNumber = (maxNum || 0) + 1;

  return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
};

// Admin: create and send invite
exports.invite = async (req, res) => {
  try {
    const { email, name, role = 'field_staff' } = req.body || {};
    if (!email || !name) return res.status(400).json({ message: 'Email and name are required' });

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ message: 'A user with this email already exists' });

    // Generate unique Staff ID with retry logic to avoid race-condition duplicates
    let invite;
    let staffId;
    let token;
    const MAX_RETRIES = 5;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      staffId = await generateStaffId();
      token = StaffInvite.generateToken();
      try {
        invite = await StaffInvite.create({
          email: email.toLowerCase(),
          name: name,
          phone: '',
          address: '',
          photoUrl: '',
          invitedBy: (req.user && mongoose.isValidObjectId(req.user._id)) ? req.user._id : undefined,
          token,
          passwordHash: '',
          staffId: staffId,
          role: role
        });
        break; // success
      } catch (e) {
        // If duplicate key on staffId, retry with a new ID; else rethrow
        if (e && e.code === 11000 && e.keyPattern && e.keyPattern.staffId) {
          if (attempt === MAX_RETRIES) throw e;
          continue;
        }
        throw e;
      }
    }

    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const verifyUrl = `${baseUrl}/staff/verify/${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin:0 auto;">
        <h2 style="color:#0B6E4F;">Staff Invitation - Holy Family Polymers</h2>
        <p>Hello ${name},</p>
        <p>You have been invited to join Holy Family Polymers as staff.</p>
        <div style="background:#f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Your Staff Details:</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Staff ID:</strong> <span style="background: #e8f5e8; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${staffId}</span></li>
            <li><strong>Role:</strong> ${role}</li>
          </ul>
        </div>
        <p>Please click the button below to complete your registration by setting your password and uploading required documents:</p>
        <p><a href="${verifyUrl}" style="background:#ff6b35;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Complete Registration</a></p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">This invitation link will expire in 7 days. If you have any questions, please contact the admin.</p>
      </div>
    `;

    // Try to send email, but don't fail if it doesn't work
    let emailSent = false;
    try {
      await sendEmail({
        email,
        subject: `Staff Invitation - Your Staff ID: ${staffId}`,
        message: `You are invited to join Holy Family Polymers. Staff ID: ${staffId}. Complete registration: ${verifyUrl}`,
        html,
      });
      emailSent = true;
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
      // Continue anyway - admin can share the link manually
    }

    // Log the invitation activity
    try {
      await ActivityLogger.logStaffInvitation(
        req.user?._id, 
        email, 
        name, 
        staffId
      );
    } catch (logErr) {
      console.error('Activity logging failed:', logErr);
    }

    res.status(201).json({ 
      message: emailSent 
        ? 'Invite sent successfully' 
        : 'Invite created successfully (email sending failed - please share the link manually)',
      inviteId: invite._id, 
      staffId: staffId,
      token,
      verifyUrl,
      emailSent
    });
  } catch (err) {
    console.error('Invite error', err);
    res.status(500).json({ message: err.message });
  }
};

// Public: get invite details for form pre-population
exports.getInviteDetails = async (req, res) => {
  try {
    const { token } = req.params;
    const invite = await StaffInvite.findOne({ token });
    
    if (!invite || invite.status !== 'sent') {
      return res.status(400).json({ message: 'Invalid or expired invite' });
    }

    // Return only safe, public information
    res.json({
      email: invite.email,
      name: invite.name || '',
      staffId: invite.staffId,
      role: invite.role
    });
  } catch (err) {
    console.error('Get invite details error', err);
    res.status(500).json({ message: 'Failed to get invite details' });
  }
};

// Public: verify invite and submit details
exports.verify = async (req, res) => {
  try {
    const { token, name, address, phone, password, photoUrl, documents } = req.body || {};
    const invite = await StaffInvite.findOne({ token });
    if (!invite || invite.status !== 'sent') return res.status(400).json({ message: 'Invalid or expired invite' });

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Full name is required' });
    }

    if (!address || address.trim() === '') {
      return res.status(400).json({ message: 'Address is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password is required and must be at least 6 characters' });
    }

    if (!phone || phone.trim() === '') {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Update invite with registration details
    invite.name = name.trim();
    invite.address = address.trim();
    invite.phone = phone.trim();
    invite.photoUrl = photoUrl || invite.photoUrl || '';
    invite.passwordHash = await bcrypt.hash(password, 10);
    invite.status = 'verified';
    invite.verifiedAt = new Date();
    invite.registrationCompleted = true;
    invite.registrationCompletedAt = new Date();
    
    // Handle document uploads
    if (documents && Array.isArray(documents)) {
      invite.documents = documents.map(doc => ({
        type: doc.type || 'other',
        filename: doc.filename || '',
        url: doc.url || '',
        uploadedAt: new Date()
      }));
    }

    await invite.save();

    // Log the registration activity
    await ActivityLogger.logStaffRegistration(
      invite._id, 
      invite.email, 
      invite.name
    );

    res.json({ 
      message: 'Registration completed successfully. Awaiting admin approval.', 
      staffId: invite.staffId,
      status: 'verified'
    });
  } catch (err) {
    console.error('Verify error', err);
    res.status(500).json({ message: err.message });
  }
};

// Admin: approve verified invite -> create user account
exports.approve = async (req, res) => {
  try {
    const { id } = req.params; // invite id
    const invite = await StaffInvite.findById(id);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });
    if (invite.status !== 'verified') return res.status(400).json({ message: 'Invite must be verified before approval' });

    // Validate required fields
    if (!invite.phone || invite.phone.trim() === '') {
      return res.status(400).json({ message: 'Phone number is required for staff approval' });
    }

    if (!invite.passwordHash) {
      return res.status(400).json({ message: 'Password must be set before approval' });
    }

    // Create user with staff ID
    const user = new User({
      name: invite.name || 'Staff',
      email: invite.email,
      phoneNumber: invite.phone,
      password: invite.passwordHash, // Already hashed
      role: invite.role || 'field_staff',
      staffId: invite.staffId,
      status: 'active',
      location: invite.address || ''
    });

    await user.save({ validateBeforeSave: false });

    invite.userId = user._id;
    invite.status = 'approved';
    invite.approvedAt = new Date();
    await invite.save();

    // Log the approval activity
    await ActivityLogger.logStaffApproval(
      req.user?._id,
      invite.staffId,
      user.name
    );

    // Send confirmation email with login instructions
    try {
      await sendEmail({
        email: user.email,
        subject: 'Your staff account is approved - Welcome to Holy Family Polymers',
        message: `Your staff account is ready. Staff ID: ${invite.staffId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 640px; margin:0 auto;">
            <h2 style="color:#0B6E4F;">Welcome to Holy Family Polymers!</h2>
            <p>Hello ${user.name},</p>
            <p>Your staff account has been approved and is now active.</p>
            <div style="background:#f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Your Login Details:</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Staff ID:</strong> <span style="background: #e8f5e8; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${invite.staffId}</span></li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Role:</strong> ${user.role}</li>
              </ul>
            </div>
            <p>You can now log in to your staff dashboard using your email and password.</p>
            <p><a href="${process.env.APP_BASE_URL || 'http://localhost:3000'}/staff/login" style="background:#ff6b35;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;">Login to Dashboard</a></p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
    }

    res.json({ 
      message: 'Staff approved successfully', 
      userId: user._id,
      staffId: invite.staffId,
      user: {
        name: user.name,
        email: user.email,
        staffId: user.staffId,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Approve error', err);
    res.status(500).json({ message: err.message });
  }
};

// Admin: list invites
exports.list = async (req, res) => {
  const items = await StaffInvite.find({}).sort({ createdAt: -1 });
  res.json({ records: items });
};

// Admin: set active/deactivate via User model
exports.setActive = async (req, res) => {
  const { id } = req.params; // user id
  const { active } = req.body || {};
  const user = await User.findByIdAndUpdate(id, { status: active ? 'active' : 'suspended', statusUpdatedAt: new Date(), statusUpdatedBy: req.user?._id }, { new: true });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
};


