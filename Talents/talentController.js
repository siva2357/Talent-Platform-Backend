const SavedTalent = require('../Talents/savedTalentModel');
const mongoose = require('mongoose');
const FreelancerProfile = require('../Profile-Details/freelancerProfileModel');

exports.saveTalent = async (req, res) => {
  try {
    const { clientId, freelancerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(clientId) || !mongoose.Types.ObjectId.isValid(freelancerId)) {
      return res.status(400).json({ success: false, message: 'Invalid clientId or freelancerId' });
    }

    const exists = await SavedTalent.findOne({ clientId, freelancerId });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Talent already saved' });
    }

    const saved = await SavedTalent.create({ clientId, freelancerId });
    return res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error('Error saving talent:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.unsaveTalent = async (req, res) => {
  try {
    const { clientId, freelancerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(clientId) || !mongoose.Types.ObjectId.isValid(freelancerId)) {
      return res.status(400).json({ success: false, message: 'Invalid clientId or freelancerId' });
    }

    const deleted = await SavedTalent.findOneAndDelete({ clientId, freelancerId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Talent not found in saved list' });
    }

    return res.status(200).json({ success: true, message: 'Talent removed from saved list' });
  } catch (error) {
    console.error('Error unsaving talent:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getSavedTalents = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ success: false, message: 'Invalid clientId' });
    }

const savedTalents = await SavedTalent.find({ clientId })
.populate('freelancerId', 'profileDetails.profilePicture.url profileDetails.fullName profileDetails.email profileDetails.phoneNumber profileDetails.primarySkillset profileDetails.gender')
  .lean();


    return res.status(200).json({
      success: true,
      total: savedTalents.length,
      data: savedTalents,
    });
  } catch (error) {
    console.error('Error fetching saved talents:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
