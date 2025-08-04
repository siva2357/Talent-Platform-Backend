const express = require('express');
const router = express.Router();
const { identifier } = require('../Middleware/identification');
const {
  signout,
  getAdminById,
  getAdminProfileById
} = require('./adminController');

// Routes
router.post('/auth/admin/signout', identifier, signout);
router.get('/admin/:id', identifier, getAdminById);
router.get('/admin/:id/profile', identifier, getAdminProfileById);

module.exports = router;
