const { signupSchema } = require("../Middleware/validator");
const Freelancer = require('../Authentication/freelancerModel');
const bcrypt = require('bcryptjs');

exports.signup = async (req, res) => {
  const { registrationDetails, role } = req.body;
  const { fullName, userName, email, password } = registrationDetails;

  try {
    const { error } = signupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const existingFreelancer = await Freelancer.findOne({ 'registrationDetails.email': email });
    if (existingFreelancer) {
      return res.status(400).json({
        success: false,
        message: "Freelancer already exists!"
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newFreelancer = new Freelancer({
      registrationDetails: {
        fullName,
        userName,
        email,
        password: hashedPassword
      },
      role: role || 'freelancer',
    });

    const result = await newFreelancer.save();
    res.status(201).json({
      success: true,
      message: "Freelancer registered successfully",
      result: {
        email: result.registrationDetails.email,
        role: result.role
      }
    });

  } catch (error) {
    console.error("Signup Error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists!"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error during registration"
    });
  }
};
