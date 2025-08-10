
const mongoose = require('mongoose');
const errorHandler = (err, req, res, next) => {
  console.error("Error Middleware Triggered:", err);
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: err.details[0].message
    });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors
    });
  }
  if (err.code && err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }
  res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = errorHandler;
