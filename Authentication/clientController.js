// Import validation schema
const { signupSchema } = require("../Middleware/validator");
const Client = require('./clientModel');
const bcrypt = require('bcryptjs');

exports.signup = async (req, res, next) => {
  const { registrationDetails, role } = req.body;
  const { fullName, email, password } = registrationDetails;

  try {
    const { error } = signupSchema.validate(req.body);
    if (error) {
      error.statusCode = 400;
      return next(error); // Pass to errorHandler
    }

    const existingClient = await Client.findOne({ 'registrationDetails.email': email });
    if (existingClient) {
      const err = new Error("Client already exists!");
      err.statusCode = 400;
      return next(err);
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
    next(error); // Forward error to middleware
  }
};

