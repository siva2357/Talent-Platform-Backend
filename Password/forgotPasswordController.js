const joi = require('joi');
const Client = require('../Authentication/clientModel');
const Freelancer = require('../Authentication/freelancerModel');
const transport = require("../Middleware/sendMail");
const { hmacProcess } = require("../Utils/hashing");
const bcrypt = require('bcryptjs');

// Utility to select the right model
const getModelByRole = (role) => {
    if (role === 'client') return Client;
    if (role === 'freelancer') return Freelancer;
    return null;
};

// ✅ Step 1: Send OTP
exports.sendForgotPasswordCode = async (req, res) => {
    const { email, role } = req.body;
    const Model = getModelByRole(role);

    if (!Model) return res.status(400).json({ success: false, message: "Invalid role!" });

    try {
        const existingUser = await Model.findOne({ 'registrationDetails.email': email });
        if (!existingUser) {
            return res.status(404).json({ success: false, message: `${role} with this email does not exist!` });
        }

        const codeValue = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);


     await transport.sendMail({
  from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
  to: email,
  subject: "Verification Code for Account Verification",
  html: `
    <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',sans-serif;border:1px solid #ddd;padding:20px;border-radius:8px;">
      <div style="text-align:center;margin-bottom:20px;">
        <img src="https://firebasestorage.googleapis.com/v0/b/talent-platform-c6b73.firebasestorage.app/o/Websites%2FFlux_Dev_A_modern_creative_logo_for_a_website_featuring_the_na_0.png?alt=media&token=8c88c807-c39f-4dc3-b34a-04da8a2c86f6" alt="FluxDev Logo" style="height:100px;">
      </div>
      <h2 style="text-align:center;color:#333;">OTP for resetting your password</h2>
      <p style="font-size:16px;text-align:center;">Please use the following code to verify your account</p>
      <div style="text-align:center;margin:30px 0;">
        <span style="display:inline-block;background:#007bff;color:white;padding:12px 24px;font-size:24px;border-radius:6px;font-weight:bold;letter-spacing:2px;">
          ${codeValue}
        </span>
      </div>
      <p style="text-align:center;font-size:14px;color:#777;">This code will expire soon. Please do not share it with anyone.</p>
    </div>
  `
});

        existingUser.registrationDetails.forgotPasswordCode = hashedCodeValue;
        existingUser.registrationDetails.forgotPasswordCodeValidation = Date.now();
        await existingUser.save();

        res.status(200).json({ success: true, message: `OTP has been sent to ${email}. Please check your inbox.` });
    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ success: false, message: "An error occurred while sending the OTP." });
    }
};

// ✅ Step 2: Verify OTP
exports.verifyForgotPasswordCode = async (req, res) => {
    const { email, providedCode, role } = req.body;
    const Model = getModelByRole(role);

    if (!Model) return res.status(400).json({ success: false, message: "Invalid role!" });

    try {
        const existingUser = await Model.findOne({ 'registrationDetails.email': email }).select("+registrationDetails.forgotPasswordCode +registrationDetails.forgotPasswordCodeValidation");

        if (!existingUser) {
            return res.status(404).json({ success: false, message: `${role} with this email does not exist!` });
        }

        if (!existingUser.registrationDetails.forgotPasswordCode || !existingUser.registrationDetails.forgotPasswordCodeValidation) {
            return res.status(400).json({ success: false, message: "No verification code found!" });
        }

        const timeDiff = Date.now() - existingUser.registrationDetails.forgotPasswordCodeValidation;
        if (timeDiff > 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: "OTP expired!" });
        }

        const hashedInputCode = hmacProcess(providedCode.toString(), process.env.HMAC_VERIFICATION_CODE_SECRET);
        if (hashedInputCode !== existingUser.registrationDetails.forgotPasswordCode) {
            return res.status(400).json({ success: false, message: "Invalid OTP!" });
        }

        // Clear OTP data
        existingUser.registrationDetails.forgotPasswordCode = undefined;
        existingUser.registrationDetails.forgotPasswordCodeValidation = undefined;
        await existingUser.save();


        await transport.sendMail({
  from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
  to: email,
  subject: "Account Verified Successfully",
  html: `
    <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',sans-serif;border:1px solid #ddd;padding:20px;border-radius:8px;">
      <div style="text-align:center;margin-bottom:20px;">
        <img src="https://firebasestorage.googleapis.com/v0/b/talent-platform-c6b73.firebasestorage.app/o/Websites%2FFlux_Dev_A_modern_creative_logo_for_a_website_featuring_the_na_0.png?alt=media&token=8c88c807-c39f-4dc3-b34a-04da8a2c86f6" alt="FluxDev Logo" style="height:100px;">
      </div>
      <h2 style="text-align:center;color:#333;">OTP verified. You can now reset your password.</h2>
      <p style="font-size:16px;">Your <strong>${role}</strong>OTP verified. You can now reset your password.</p>
      <p style="margin-top:30px;">Thanks & Regards,<br><strong>Talent Hub</strong></p>
    </div>
  `
});



        res.status(200).json({ success: true, message: "OTP verified. You can now reset your password." });
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: "Error verifying OTP." });
    }
};

// ✅ Step 3: Reset Password
exports.resetPassword = async (req, res) => {
    const { email, newPassword, role } = req.body;
    const Model = getModelByRole(role);

    if (!Model) return res.status(400).json({ success: false, message: "Invalid role!" });

    try {
        const existingUser = await Model.findOne({ 'registrationDetails.email': email });
        if (!existingUser) {
            return res.status(404).json({ success: false, message: `${role} with this email does not exist!` });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long, contain an uppercase letter, lowercase letter, number, and special character."
            });
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        existingUser.registrationDetails.password = hashedPassword;

        // Clean up OTP fields just in case
        existingUser.registrationDetails.forgotPasswordCode = undefined;
        existingUser.registrationDetails.forgotPasswordCodeValidation = undefined;

        await existingUser.save();

                await transport.sendMail({
  from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
  to: email,
  subject: "Password Reset Successfully",
  html: `
    <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',sans-serif;border:1px solid #ddd;padding:20px;border-radius:8px;">
      <div style="text-align:center;margin-bottom:20px;">
        <img src="https://firebasestorage.googleapis.com/v0/b/talent-platform-c6b73.firebasestorage.app/o/Websites%2FFlux_Dev_A_modern_creative_logo_for_a_website_featuring_the_na_0.png?alt=media&token=8c88c807-c39f-4dc3-b34a-04da8a2c86f6" alt="FluxDev Logo" style="height:100px;">
      </div>
      <h2 style="text-align:center;color:#333;">Password Reset Successfull</h2>
      <p style="font-size:16px;">Your <strong>${role}</strong>You can now log in with new password</p>
      <p style="margin-top:30px;">Thanks & Regards,<br><strong>Talent Hub</strong></p>
    </div>
  `
});



        res.status(200).json({ success: true, message: "Password reset successful. You can now log in." });
    } catch (error) {
        console.error("Password Reset Error:", error);
        res.status(500).json({ success: false, message: "Error resetting password." });
    }
};
