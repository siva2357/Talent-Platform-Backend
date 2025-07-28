const express = require('express');
const router = express.Router();
const changePasswordController = require('./changePasswordController');
const { identifier } = require('../Middleware/identification');

// Change Password - Client
router.patch('/auth/client/:id/change-password', identifier, changePasswordController.changePassword);

// Change Password - Freelancer
router.patch('/auth/freelancer/:id/change-password', identifier, changePasswordController.changePassword);

module.exports = router;
