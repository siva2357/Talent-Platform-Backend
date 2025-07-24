const client = require('../Authentication/clientModel');
const freelancer = require('../Authentication/freelancerModel');
const transport = require("../Middleware/sendMail");
const { hmacProcess } = require("../Utils/hashing");
const { acceptCodeSchema } = require('../Middleware/validator');

// Send Verification Code
exports.sendVerificationCode = async (req, res) => {
    const { email } = req.body;

    try {
        let user = await client.findOne({ 'registrationDetails.email': email });
        let role = 'Client';

        if (!user) {
            user = await freelancer.findOne({ 'registrationDetails.email': email });
            role = 'Freelancer';
        }

        if (!user) {
            return res.status(404).json({ success: false, message: "User with this email does not exist!" });
        }

        const codeValue = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);

let info = await transport.sendMail({
  from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
  to: email,
  subject: "Verification Code for Account Verification",
  html: `
    <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',sans-serif;border:1px solid #ddd;padding:20px;border-radius:8px;">
      <div style="text-align:center;margin-bottom:20px;">
        <img src="https://firebasestorage.googleapis.com/v0/b/talent-platform-c6b73.firebasestorage.app/o/Websites%2FFlux_Dev_A_modern_creative_logo_for_a_website_featuring_the_na_0.png?alt=media&token=8c88c807-c39f-4dc3-b34a-04da8a2c86f6" alt="FluxDev Logo" style="height:100px;">
      </div>
      <h2 style="text-align:center;color:#333;">Your OTP for Account Verification</h2>
      <p style="font-size:16px;text-align:center;">Please use the following code to verify your account:</p>
      <div style="text-align:center;margin:30px 0;">
        <span style="display:inline-block;background:#007bff;color:white;padding:12px 24px;font-size:24px;border-radius:6px;font-weight:bold;letter-spacing:2px;">
          ${codeValue}
        </span>
      </div>
      <p style="text-align:center;font-size:14px;color:#777;">This code will expire soon. Please do not share it with anyone.</p>
    </div>
  `
});


        if (info.accepted[0] === email) {
            user.registrationDetails.verificationCode = hashedCodeValue;
            user.registrationDetails.verificationCodeValidation = Date.now();
            await user.save();
        }

        res.status(200).json({
            success: true,
            message: `OTP has been sent to ${email}. Please check your inbox.`,
            role
        });

    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ success: false, message: "An error occurred while sending the OTP." });
    }
};

// Verify Code
exports.verifyCode = async (req, res) => {
    const { error } = acceptCodeSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { email, providedCode } = req.body;

    try {
        let user = await client.findOne({ 'registrationDetails.email': email })
            .select("+registrationDetails.verificationCode +registrationDetails.verificationCodeValidation");
        let role = 'Client';

        if (!user) {
            user = await freelancer.findOne({ 'registrationDetails.email': email })
                .select("+registrationDetails.verificationCode +registrationDetails.verificationCodeValidation");
            role = 'Freelancer';
        }

        if (!user) {
            return res.status(404).json({ success: false, message: "User with this email does not exist!" });
        }

        if (!user.registrationDetails.verificationCode || !user.registrationDetails.verificationCodeValidation) {
            return res.status(400).json({ success: false, message: "No verification code found!" });
        }

        if (Date.now() - user.registrationDetails.verificationCodeValidation > 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: "Verification code has expired!" });
        }

        const hashedCodeValue = hmacProcess(providedCode.toString(), process.env.HMAC_VERIFICATION_CODE_SECRET);

if (hashedCodeValue === user.registrationDetails.verificationCode) {
    user.registrationDetails.verified = true;
    user.registrationDetails.verificationCode = undefined;
    user.registrationDetails.verificationCodeValidation = undefined;
    await user.save();

    // ✅ Send confirmation email
await transport.sendMail({
  from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
  to: email,
  subject: "Account Verified Successfully",
  html: `
    <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',sans-serif;border:1px solid #ddd;padding:20px;border-radius:8px;">
      <div style="text-align:center;margin-bottom:20px;">
        <img src="https://firebasestorage.googleapis.com/v0/b/talent-platform-c6b73.firebasestorage.app/o/Websites%2FFlux_Dev_A_modern_creative_logo_for_a_website_featuring_the_na_0.png?alt=media&token=8c88c807-c39f-4dc3-b34a-04da8a2c86f6" alt="FluxDev Logo" style="height:100px;">
      </div>
      <h2 style="text-align:center;color:#333;">Account Verified!</h2>
      <p style="font-size:16px;">Hello ${user.registrationDetails.fullName || ''},</p>
      <p style="font-size:16px;">Your <strong>${role}</strong> account has been successfully verified and activated.</p>
      <p style="font-size:16px;">You can now log in and start using our platform.</p>
      <p style="margin-top:30px;">Thanks & Regards,<br><strong>Talent Hub</strong></p>
    </div>
  `
});


    return res.status(200).json({
        success: true,
        message: "User account has been verified successfully.",
        role
    });
}


        return res.status(400).json({ success: false, message: "Invalid verification code!" });

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, message: "Internal server error during code verification." });
    }
};
