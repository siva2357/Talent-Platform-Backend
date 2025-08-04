const express = require("express");
const router = express.Router();
const offerCtrl = require("../Offer-letter/offerLetterController");
const { identifier } = require ("../Middleware/identification")

// Client sends offer
router.post("/offers/send",  identifier, offerCtrl.sendOffer);

// Freelancer views their offers
router.get("/offers/my", identifier, offerCtrl.getFreelancerOffers);

// Freelancer accepts or rejects
router.post("/offers/respond", identifier, offerCtrl.respondToOffer);

// Client views offers they've sent
router.get("/offers/client", identifier, offerCtrl.getClientOffers);

module.exports = router;
