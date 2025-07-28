const express = require('express');
const router = express.Router();
const otpController = require('../Otp-Verification/otpVerificationController')
// ✅ Use consistent param name: :instructorId everywhere
router.post('/auth/send-verification-code', otpController.sendVerificationCode);
router.post('/auth/verify-verification-code', otpController.verifyCode);

module.exports = router;
