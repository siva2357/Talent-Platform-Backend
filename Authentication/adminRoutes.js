const express = require('express');
const router = express.Router();
const { identifier } = require('../Middleware/identification');
const { signout, getAdminById } = require('./adminController');

router.post('/auth/admin/signout', identifier, signout);
router.get('/admin/:id', identifier, getAdminById);

module.exports = router;
