// client.routes.js (Routes)
const express = require('express');
const router = express.Router();
const clientProfileController = require('./clientProfileController');
const { identifier } = require('../Middleware/identification');

// ✅ Consistent usage of :clientId
router.post('/client/profile-details', identifier, clientProfileController.createClientProfile);
router.put('/client/:clientId/profile-details', identifier, clientProfileController.updateClientProfile);
router.get('/client/:clientId/profile-details', identifier, clientProfileController.getClientProfile);
router.get('/client/:clientId/profile-settings', identifier, clientProfileController.getClientById);
router.get('/client/:clientId/profile', identifier, clientProfileController.getClientHeaderInfo);

router.get('/client/:clientId/profile/basic-details', identifier, clientProfileController.getClientBasicDetails);
router.put('/client/:clientId/profile/basic-details', identifier, clientProfileController.updateBasicDetails);

router.get('/client/:clientId/profile/picture', identifier, clientProfileController.getClientProfilePicture);
router.put('/client/:clientId/profile/picture', identifier, clientProfileController.updateClientProfilePicture);

router.get('/client/:clientId/profile/social-media', identifier, clientProfileController.getClientSocialMedia);
router.put('/client/:clientId/profile/social-media', identifier, clientProfileController.updateSocialMedia);

// Delete client profile
router.delete('/auth/client/:clientId/delete', identifier, clientProfileController.deleteClientById);

module.exports = router;
