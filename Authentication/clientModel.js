// Import mongoose for schema creation
const mongoose = require('mongoose');

// Define the schema for Client users
const clientSchema = mongoose.Schema({
  registrationDetails: {
    fullName: { type: String, required: true },
    email: { type: String, required: true, trim: true, unique: true,minLength: [5, "Email must have at least 5 characters!"],lowercase: true},
    password: { type: String, required: true,trim: true, select: false },
    verified: { type: Boolean, default: false },
    verificationCode: { type: String, select: false },
    verificationCodeValidation: { type: Number, select: false },
    forgotPasswordCode: { type: String, select: false },
    forgotPasswordCodeValidation: { type: Number, select: false }
  },
  role: { type: String, default: 'client' },
  lastLoginAt: { type: Date },
  lastLogoutAt: { type: Date },
  status: { type: String, enum: ["active", "inactive"], default: "inactive" }
}, { timestamps: true });

module.exports = mongoose.model('Client', clientSchema);
