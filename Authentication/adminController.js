const bcrypt = require('bcryptjs');
const AdminModel = require('../Authentication/adminModel');

// Default admin details
const defaultAdmin = {
  registrationDetails: {
    fullName: "Admin User",
    userName: "admin",
    email: "creative.official08@gmail.com",
    password: "Siva@2357",
    profilePicture: "https://res.cloudinary.com/dpp8aspqs/image/upload/v1737024440/Logo_qboacm.svg",
    verified: true
  },
  role: "admin"
};

// Create default admin on server start
exports.createDefaultAdmin = async () => {
  try {
    const existingAdmin = await AdminModel.findOne({ 'registrationDetails.email': defaultAdmin.registrationDetails.email });

    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(defaultAdmin.registrationDetails.password, salt);

      const newAdmin = new AdminModel({
        registrationDetails: {
          ...defaultAdmin.registrationDetails,
          password: hashedPassword
        },
        role: defaultAdmin.role
      });

      await newAdmin.save();
      console.log("✅ Default admin created successfully.");
    } else {
      console.log("⚠️ Default admin already exists.");
    }
  } catch (error) {
    console.error("❌ Error creating default admin:", error);
  }
};


// Sign out admin
exports.signout = (req, res) => {
  res.clearCookie('Authorization').status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Get admin by ID
exports.getAdminById = async (req, res) => {
  try {
    const admin = await AdminModel.findById(req.params.id).select('-registrationDetails.password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.status(200).json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
