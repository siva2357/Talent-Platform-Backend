const express = require('express');
const router = express.Router();
const freelancerProfileController = require('./freelancerProfileController');
const { identifier } = require('../Middleware/identification');

// CRUD routes for Freelancer Profile
router.post('/freelancer/profile-details', identifier, freelancerProfileController.createFreelancerProfile);
router.put('/freelancer/:freelancerId/profile-details', identifier, freelancerProfileController.updateFreelancerProfile);
router.get('/freelancer/:freelancerId/profile-details', identifier, freelancerProfileController.getFreelancerProfile);



router.get('/client/talents', identifier, freelancerProfileController.getAllTalents);
router.get('/client/talents/:talentId/talent-profile', identifier, freelancerProfileController.getTalentById);


// Settings + Header Info
router.get('/freelancer/:freelancerId/profile-settings', identifier, freelancerProfileController.getFreelancerById);
router.get('/freelancer/:freelancerId/profile', identifier, freelancerProfileController.getFreelancerHeaderInfo);

// Basic Details
router.get('/freelancer/:freelancerId/profile/basic-details', identifier, freelancerProfileController.getFreelancerBasicDetails);
router.put('/freelancer/:freelancerId/profile/basic-details', identifier, freelancerProfileController.updateFreelancerBasicDetails);

// Profile Picture
router.get('/freelancer/:freelancerId/profile/picture', identifier, freelancerProfileController.getFreelancerProfilePicture);
router.put('/freelancer/:freelancerId/profile/picture', identifier, freelancerProfileController.updateProfilePicture);

// Social Media
router.get('/freelancer/:freelancerId/profile/professional', identifier, freelancerProfileController.getProfessionalDetails);
router.put('/freelancer/:freelancerId/profile/professional', identifier, freelancerProfileController.updateProfessionalDetails);


// Delete
router.delete('/auth/freelancer/:freelancerId/delete', identifier, freelancerProfileController.deleteFreelancerById);

module.exports = router;
