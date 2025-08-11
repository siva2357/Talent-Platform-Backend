// routes/savedTalentRoutes.js
const express = require('express');
const router = express.Router();
const savedTalentController = require('./talentController');
const { identifier } = require('../Middleware/identification');



router.post('/client/save-talent', identifier,savedTalentController.saveTalent);
router.delete('/client/unsave-talents', identifier,savedTalentController.unsaveTalent);
router.get('/client/:clientId/saved-talents', identifier,savedTalentController.getSavedTalents);

module.exports = router;
