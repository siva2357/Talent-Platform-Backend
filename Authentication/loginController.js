const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../Authentication/adminModel');
const Client = require('../Authentication/clientModel');
const Freelancer = require('../Authentication/freelancerModel');
const ClientProfile = require('../Profile-Details/clientProfileModel');
const FreelancerProfile = require('../Profile-Details/freelancerProfileModel');
require('dotenv').config();


const findUserAndVerify = async (model, profileModel, idField, role, email, password) => {
  const user = await model.findOne({ 'registrationDetails.email': email })
    .select('+registrationDetails.password +registrationDetails.verified');

  if (!user) return null;

  if (!user.registrationDetails.password) {
    console.error("Password is undefined for user:", email);
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, user.registrationDetails.password);
  if (!isValidPassword) return null;

  if (!user.registrationDetails.verified) {
    return { unverified: true };
  }

  const profile = profileModel
    ? await profileModel.findOne({ [idField]: user._id })
    : null;

  return { user, profile, role };
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required!" });
    }

    const roles = [
      { model: Admin, profileModel: null, idField: '', role: 'admin' },
      { model: Freelancer, profileModel: FreelancerProfile, idField: 'freelancerId', role: 'freelancer' },
      { model: Client, profileModel: ClientProfile, idField: 'clientId', role: 'client' },
    ];

    let userData = null;
    for (const r of roles) {
      userData = await findUserAndVerify(r.model, r.profileModel, r.idField, r.role, email, password);
      if (userData) break;
    }

    if (!userData) {
      return res.status(401).json({ success: false, message: "Invalid email or password!" });
    }

    if (userData.unverified) {
      return res.status(403).json({ success: false, message: "Email not verified. Please verify your email." });
    }

    const { user, profile, role } = userData;
    const fullName = user.registrationDetails.fullName;

    const token = jwt.sign(
      {
        userId: user._id,
        role,
        fullName,
        verified: user.registrationDetails.verified,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: "8h" }
    );

    user.lastLoginAt = new Date();
    user.status = "active";
    await user.save();

    let profileComplete = true;
    if (role === "freelancer" || role === "client") {
      profileComplete = !!(profile && profile.profileDetails);
    }

    res.cookie("Authorization", "Bearer " + token, {
      httpOnly: true,
      secure: false,
      expires: new Date(Date.now() + 8 * 3600000),
    });

    res.json({
      success: true,
      message: "Logged in successfully",
      token,
      role,
      fullName,
      userId: user._id,
      verified: user.registrationDetails.verified,
      profileComplete,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: "Login error. Try again later." });
  }
};

exports.logout = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const models = {
      admin: Admin,
      freelancer: Freelancer,
      client: Client,
    };
    const model = models[role];
    if (!model) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    const user = await model.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.lastLogoutAt = new Date();
    user.status = "inactive";
    await user.save();
    res.clearCookie("Authorization");
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout Error:", err);
    res.status(500).json({ success: false, message: "Logout error. Try again later." });
  }
};
