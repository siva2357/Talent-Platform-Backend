// Import validation schema
const { signupSchema } = require("../Middleware/validator");
const Client = require('./clientModel');
const bcrypt = require('bcryptjs');

exports.signup = async (req, res) => {
  const { registrationDetails, role } = req.body;
  const { fullName, email, password } = registrationDetails;

  try {
    const { error } = signupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const existingClient = await Client.findOne({ 'registrationDetails.email': email });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: "Client already exists!"
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newClient = new Client({
      registrationDetails: {
        fullName,
        email,
        password: hashedPassword
      },
      role: role || 'client',
    });

    const result = await newClient.save();
    res.status(201).json({
      success: true,
      message: "Your account has been registered successfully",
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
      message: "An error occurred during registration. Please try again."
    });
  }
};
