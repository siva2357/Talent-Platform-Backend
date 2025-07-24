const mongoose = require('mongoose');

// Define schema for Admin users
const adminSchema = mongoose.Schema({
  registrationDetails: {
    fullName: { type: String, required: true },
    userName: { type: String, required: true, unique: true },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minLength: [5, "Email must have at least 5 characters!"],
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      trim: true,
      select: false
    },
    profilePicture: { type: String, default: '' },
    verified: { type: Boolean, default: true }
  },
  role: { type: String, enum: ['admin'], default: 'admin' }
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
