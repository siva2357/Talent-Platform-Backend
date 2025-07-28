const express = require('express');
const router = express.Router();

// Import freelancer controller
const freelancerController = require('./freelancerController');

// Route for freelancer signup
router.post('/auth/freelancer/signup', freelancerController.signup);

module.exports = router;
