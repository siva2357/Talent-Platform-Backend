const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  registrationDetails: {
    fullName: { type: String, required: true },
    userName: { type: String, required: true, unique: true },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: [5, 'Email must have at least 5 characters!'],
      lowercase: true
    },
    password: { type: String, required: true, select: false },
    profilePicture: { type: String, default: '' },
    verified: { type: Boolean, default: true }
  },
  role: { type: String, default: 'admin' },
  lastLoginAt: { type: Date },
  lastLogoutAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
