const express = require('express');
const router = express.Router();
const { identifier } = require('../Middleware/identification');

// Import controller methods
const { signout, getAdminById } = require('./adminController');

// Routes
router.post('/auth/admin/signout', identifier, signout);
router.get('/admin/:id', identifier, getAdminById);

module.exports = router;
