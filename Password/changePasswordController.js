const Client = require("../Authentication/clientModel");
const Freelancer = require('../Authentication/freelancerModel');
const bcrypt = require('bcryptjs');
const { changePasswordSchema } = require('../Middleware/validator'); // Joi schema
const transport = require("../Middleware/sendMail");
exports.changePassword = async (req, res) => {
  const { verified, role, userId } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    // Validate input
    const { error } = changePasswordSchema.validate({ oldPassword, newPassword });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    if (!verified) {
      return res.status(401).json({ success: false, message: `You are not verified as a ${role}` });
    }

    // Determine model
    let userModel;
    if (role === 'client') {
      userModel = Client;
    } else if (role === 'freelancer') {
      userModel = Freelancer;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid user role' });
    }

    // Fetch user
    const user = await userModel.findById(userId).select('+registrationDetails.password');
    if (!user) {
      return res.status(404).json({ success: false, message: `${role} not found` });
    }

    // Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.registrationDetails.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Old password is incorrect' });
    }

    // Hash and save new password
    const salt = await bcrypt.genSalt(12);
    user.registrationDetails.password = await bcrypt.hash(newPassword, salt);
    await user.save();

        // ✅ Send email notification
    const email = user.registrationDetails.email;
  await transport.sendMail({
  from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
  to: email,
  subject: "Password Changed Successfully",
  html: `
    <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',sans-serif;border:1px solid #ddd;padding:20px;border-radius:8px;">
      <div style="text-align:center;margin-bottom:20px;">
        <img src="https://firebasestorage.googleapis.com/v0/b/talent-platform-c6b73.firebasestorage.app/o/Websites%2FFlux_Dev_A_modern_creative_logo_for_a_website_featuring_the_na_0.png?alt=media&token=8c88c807-c39f-4dc3-b34a-04da8a2c86f6" alt="FluxDev Logo" style="height:100px;">
      </div>
      <p>Hello ${user.registrationDetails.fullName || 'User'},</p>
        <p>Your password has been successfully updated on our platform.</p>
        <p>If you did not initiate this change, please contact our support team immediately.</p>
           <br>
      <p style="margin-top:30px;">Thanks & Regards,<br><strong>Talent Hub</strong></p>
    </div>
  `
});


    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
