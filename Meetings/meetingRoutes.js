const express = require('express');
const router = express.Router();
const meetingController = require('./meetingController');
const { identifier } = require('../Middleware/identification');

router.post('/client/meetings', identifier, meetingController.createMeeting);
router.get('/client/meetings', identifier, meetingController.getAllMeetingsByClient);
router.get('/client/meetings/:id', identifier, meetingController.getMeetingByIdForClient);
router.patch('/client/meetings/:id', identifier, meetingController.updateMeetingById);
router.delete('/client/meetings/:id', identifier, meetingController.deleteMeetingById);

// -------------------- FREELANCER ROUTES --------------------
router.get('/freelancer/meetings', identifier, meetingController.getAllMeetingsByFreelancer);
router.get('/freelancer/meetings/:id', identifier, meetingController.getMeetingByIdForFreelancer);


module.exports = router;
