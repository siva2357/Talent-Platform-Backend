const express = require('express');
const router = express.Router();

// Import client controller
const clientController = require('./clientController');

// Route for client signup
router.post('/auth/client/signup', clientController.signup);

module.exports = router;
