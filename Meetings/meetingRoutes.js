const express = require('express');
const router = express.Router();
const meetingEventController = require('./meetingController');
const { identifier } = require('../Middleware/identification');

router.post('/meetings/create', identifier, meetingEventController.createMeetingEvent);
router.get('/meetings/all', identifier, meetingEventController.getAllMeetingEvents);
router.delete('/meetings/:meetingId', identifier, meetingEventController.deleteMeetingEvent);
router.put('/meetings/:meetingId/status', identifier, meetingEventController.updateMeetingStatus);

module.exports = router;
