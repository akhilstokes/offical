const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  role: { 
    type: String, 
    enum: ['user', 'admin', 'manager', 'accountant', 'field_staff', 'delivery_staff', 'lab', 'lab_manager', 'lab_staff', 'staff'], 
    default: 'user' 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  read: { type: Boolean, default: false, index: true },
  meta: { type: Object },
  priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
