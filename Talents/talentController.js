const SavedTalent = require('../Talents/savedTalentModel');
const mongoose = require('mongoose');
const FreelancerProfile = require('../Profile-Details/freelancerProfileModel');



exports.saveTalent = async (req, res) => {
  try {
    const { clientId, freelancerId } = req.body;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(clientId) || !mongoose.Types.ObjectId.isValid(freelancerId)) {
      return res.status(400).json({ success: false, message: 'Invalid clientId or freelancerId' });
    }

    // Check if already saved
    const exists = await SavedTalent.findOne({ clientId, freelancerId });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Talent already saved' });
    }

    // Create saved talent entry
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

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(clientId) || !mongoose.Types.ObjectId.isValid(freelancerId)) {
      return res.status(400).json({ success: false, message: 'Invalid clientId or freelancerId' });
    }

    // Remove saved talent entry
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

    const savedTalents = await SavedTalent.find({ clientId, freelancerId: { $ne: null } })
      .populate('freelancerId')
      .lean();

    const freelancerIds = savedTalents.map(item => item.freelancerId._id);

    const profiles = await FreelancerProfile.find({ freelancerId: { $in: freelancerIds } })
      .select('profileDetails freelancerId')
      .lean();

    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.freelancerId.toString()] = p;
    });

    const results = savedTalents.map(item => ({
      ...item,
      profileDetails: profileMap[item.freelancerId._id.toString()]?.profileDetails || null
    }));

    const filteredResults = results.map(item => ({
      freelancerId: item.freelancerId._id.toString(),
      saved: item.saved,  // <-- include saved value here
      profileDetails: {
        profilePicture: {
          url: item.profileDetails?.profilePicture?.url || null,
        },
        fullName: item.profileDetails?.fullName || '',
        gender: item.profileDetails?.gender || '',
        email: item.profileDetails?.email || '',
        phoneNumber: item.profileDetails?.phoneNumber || '',
        primarySkillset: item.profileDetails?.primarySkillset || [],
      }
    }));

    return res.status(200).json({
      success: true,
      total: filteredResults.length,
      data: filteredResults,
    });

  } catch (error) {
    console.error('Error fetching saved talents:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


