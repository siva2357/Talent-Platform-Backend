const mongoose = require('mongoose');

const freelancerSchema = mongoose.Schema({
  registrationDetails: {
    fullName: { type: String, required: true },
    email: { type: String, required: true, trim: true, unique: true, minLength: [5, "Email must have at least 5 characters!"], lowercase: true },
    password: { type: String, required: true, trim: true, select: false },
    verified: { type: Boolean, default: false },
    verificationCode: { type: String, select: false },
    verificationCodeValidation: { type: Number, select: false },
    forgotPasswordCode: { type: String, select: false },
    forgotPasswordCodeValidation: { type: Number, select: false }
  },
  role: { type: String, default: 'freelancer' },
  lastLoginAt: { type: Date },
  lastLogoutAt: { type: Date },
  status: { type: String, enum: ["active", "inactive"], default: "inactive" }
}, { timestamps: true });

module.exports = mongoose.model('Freelancer', freelancerSchema);
