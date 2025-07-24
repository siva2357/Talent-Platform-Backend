const Freelancer = require('../Authentication/freelancerModel');
const FreelancerProfile = require('../Profile-Details/freelancerProfileModel');

// CREATE
exports.createFreelancerProfile = async (req, res) => {
  try {
    if (!req.freelancerId) {
      return res.status(401).json({ message: "Unauthorized: Freelancer ID is missing" });
    }

    const freelancer = await Freelancer.findById(req.freelancerId);
    if (!freelancer) return res.status(404).json({ message: "Freelancer not found" });

    const existingProfile = await FreelancerProfile.findOne({ freelancerId: req.freelancerId });
    if (existingProfile) return res.status(400).json({ message: "Profile already exists" });

    const { email, fullName, userName } = freelancer.registrationDetails || {};
    const profileDetails = {
      profilePicture: req.body.profileDetails.profilePicture || {},
      fullName: fullName || req.body.profileDetails.fullName,
      userName: userName || req.body.profileDetails.userName,
      email: email || req.body.profileDetails.email,
      gender: req.body.profileDetails.gender,
      bioDescription: req.body.profileDetails.bioDescription,
      socialMedia: req.body.profileDetails.socialMedia || [],
    };

    const newProfile = new FreelancerProfile({
      freelancerId: req.freelancerId,
      profileDetails
    });

    await newProfile.save();
    res.status(201).json({ message: "Freelancer profile created", freelancerProfile: newProfile });
  } catch (error) {
    console.error("Create profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET PROFILE BY ID
exports.getFreelancerProfile = async (req, res) => {
  try {
    const freelancerId = req.params.freelancerId;
    if (!freelancerId) return res.status(400).json({ message: "Freelancer ID is required" });

    const freelancer = await Freelancer.findById(freelancerId);
    const profile = await FreelancerProfile.findOne({ freelancerId });

    if (!freelancer || !profile) {
      return res.status(404).json({ message: "Freelancer profile not found" });
    }

    profile.profileDetails.email = freelancer.registrationDetails.email;
    profile.profileDetails.fullName = freelancer.registrationDetails.fullName;
    profile.profileDetails.userName = freelancer.registrationDetails.userName;

    res.status(200).json(profile);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// UPDATE
exports.updateFreelancerProfile = async (req, res) => {
  try {
    if (!req.freelancerId) {
      return res.status(401).json({ message: "Unauthorized: Freelancer ID is missing" });
    }

    const freelancer = await Freelancer.findById(req.freelancerId);
    const profile = await FreelancerProfile.findOne({ freelancerId: req.freelancerId });

    if (!freelancer || !profile) {
      return res.status(404).json({ message: "Freelancer profile not found" });
    }

    const { profileDetails } = req.body;
    if (!profileDetails) return res.status(400).json({ message: "Profile details required" });

    delete profileDetails.email;
    delete profileDetails.fullName;
    delete profileDetails.userName;

    profile.profileDetails = {
      ...profile.profileDetails,
      ...profileDetails
    };

    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getFreelancerById = async (req, res) => {
  try {
    const freelancer = await Freelancer.findById(req.params.id);
    if (!freelancer) {
      return res.status(404).json({ message: 'Freelancer not found' });
    }
    res.status(200).json(freelancer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE
exports.deleteFreelancerById = async (req, res) => {
  try {
    const freelancerId = req.params.freelancerId;
    const found = await Freelancer.findById(freelancerId);
    if (!found) return res.status(404).json({ message: "Freelancer not found" });

    await FreelancerProfile.deleteMany({ freelancerId });
    await Freelancer.findByIdAndDelete(freelancerId);

    res.status(200).json({ message: "Freelancer and profile deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// BASIC INFO
exports.getFreelancerBasicDetails = async (req, res) => {
  try {
    const freelancerId = req.params.freelancerId;
    const freelancer = await Freelancer.findById(freelancerId);
    const profile = await FreelancerProfile.findOne({ freelancerId });

    if (!freelancer || !profile) return res.status(404).json({ message: "Freelancer or profile not found" });

    const basicDetails = {
      fullName: freelancer.registrationDetails.fullName,
      userName: freelancer.registrationDetails.userName,
      email: freelancer.registrationDetails.email,
      gender: profile.profileDetails.gender,
      bioDescription: profile.profileDetails.bioDescription,
    };

    res.status(200).json(basicDetails);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateBasicDetails = async (req, res) => {
  try {
    const freelancerId = req.params.freelancerId;
    const { userName, gender, bioDescription } = req.body;

    const freelancer = await Freelancer.findById(freelancerId);
    const profile = await FreelancerProfile.findOne({ freelancerId });

    if (!freelancer || !profile) return res.status(404).json({ message: "Freelancer or profile not found" });

    if (userName) freelancer.registrationDetails.userName = userName;
    await freelancer.save();

    if (gender) profile.profileDetails.gender = gender;
    if (bioDescription) profile.profileDetails.bioDescription = bioDescription;
    await profile.save();

    res.status(200).json({ message: "Basic details updated" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// HEADER
// freelancerProfileController.js
exports.getFreelancerHeaderInfo = async (req, res) => {
  try {
    const freelancerId = req.params.id; // 👈 Make sure it matches your route param
    const freelancer = await Freelancer.findById(freelancerId);
    const profile = await FreelancerProfile.findOne({ freelancerId });

    if (!freelancer || !profile) {
      return res.status(404).json({ message: "Freelancer or profile not found" });
    }

    const header = {
      fullName: freelancer.registrationDetails.fullName,
      profilePicture: {
        fileName: profile.profileDetails.profilePicture?.fileName || null,
        url: profile.profileDetails.profilePicture?.url || null
      }
    };

    res.status(200).json(header);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


// SOCIAL MEDIA
exports.getFreelancerSocialMedia = async (req, res) => {
  try {
    const freelancerId = req.params.freelancerId;
    const profile = await FreelancerProfile.findOne({ freelancerId }, { 'profileDetails.socialMedia': 1, _id: 0 });

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    res.status(200).json({ message: "Social media fetched", socialMedia: profile.profileDetails.socialMedia });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateSocialMedia = async (req, res) => {
  try {
    const { socialMedia } = req.body;
    if (!Array.isArray(socialMedia)) {
      return res.status(400).json({ message: "Invalid format" });
    }

    const profile = await FreelancerProfile.findOne({ freelancerId: req.freelancerId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    profile.profileDetails.socialMedia = socialMedia;
    await profile.save();

    res.status(200).json({ message: "Social media updated", socialMedia });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// PROFILE PICTURE
exports.getFreelancerProfilePicture = async (req, res) => {
  try {
    const freelancerId = req.params.freelancerId;
    const profile = await FreelancerProfile.findOne({ freelancerId }, { 'profileDetails.profilePicture': 1, _id: 0 });

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    res.status(200).json({ profilePicture: profile.profileDetails.profilePicture });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateProfilePicture = async (req, res) => {
  try {
    const freelancerId = req.params.freelancerId;
    const { profilePicture } = req.body;

    if (!profilePicture?.fileName || !profilePicture?.url) {
      return res.status(400).json({ message: "Invalid profile picture" });
    }

    const profile = await FreelancerProfile.findOne({ freelancerId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    profile.profileDetails.profilePicture = profilePicture;
    await profile.save();

    res.status(200).json({ message: "Profile picture updated", profilePicture });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
