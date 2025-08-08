const express = require('express');
const router = express.Router();
const meetingCtrl = require('./meetingController');
const { identifier } = require('../Middleware/identification');

router.post('/meetings', identifier, meetingCtrl.createMeeting);
router.get('/meetings/all', identifier, meetingCtrl.getAllMeetings);
router.get('/meetings/:id', identifier, meetingCtrl.getMeetingById);
router.put('/meetings/:id', identifier, meetingCtrl.updateMeetingById);
router.delete('/meetings/:id', identifier, meetingCtrl.deleteMeetingById);


module.exports = router;
