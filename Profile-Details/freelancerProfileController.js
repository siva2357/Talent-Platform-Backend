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

    const { email, fullName } = freelancer.registrationDetails || {};
    const profileDetails = {
      profilePicture: {
        fileName: req.body.profileDetails.profilePicture?.fileName,
        url: req.body.profileDetails.profilePicture?.url
      },
      fullName: fullName || req.body.profileDetails.fullName,
      email: email || req.body.profileDetails.email,
      userName: req.body.profileDetails.userName,
      gender: req.body.profileDetails.gender,
      dob: req.body.profileDetails.dob,
      phoneNumber: req.body.profileDetails.phoneNumber,
      bioDescription: req.body.profileDetails.bioDescription,
      primarySkillset: req.body.profileDetails.primarySkillset || [],
      experience: req.body.profileDetails.experience,
      toolsAndTechnologies: req.body.profileDetails.toolsAndTechnologies || [],
      socialMedia: req.body.profileDetails.socialMedia || [],
    };

    const newProfile = new FreelancerProfile({
      freelancerId: req.freelancerId,
      profileDetails,
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

    const updatedDetails = req.body.profileDetails;
    if (!updatedDetails) {
      return res.status(400).json({ message: "Profile details required" });
    }

    // Block any attempt to overwrite primary fields
    delete updatedDetails.email;
    delete updatedDetails.fullName;

    profile.profileDetails = {
      ...profile.profileDetails,
      ...updatedDetails
    };

    await profile.save();
    res.status(200).json({ message: "Profile updated successfully", profile });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getFreelancerById = async (req, res) => {
  try {
    const freelancer = await Freelancer.findById(req.params.freelancerId);
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
    const { freelancerId } = req.params;
    console.log('[DEBUG] Deletion triggered for freelancerId:', freelancerId);

    const freelancer = await Freelancer.findById(freelancerId);
    if (!freelancer) {
      console.warn('[WARN] Freelancer not found with ID:', freelancerId);
      return res.status(404).json({ message: 'Freelancer not found' });
    }

    const profileDeleteResult = await FreelancerProfile.deleteMany({ freelancerId });
    console.log('[DEBUG] Deleted freelancer profiles count:', profileDeleteResult.deletedCount);

    await Freelancer.findByIdAndDelete(freelancerId);
    console.log('[DEBUG] Freelancer deleted');

    return res.status(200).json({ message: 'Freelancer and associated profile(s) deleted successfully' });
  } catch (error) {
    console.error('[ERROR] Deleting freelancer:', error);
    return res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};


// BASIC INFO
exports.getFreelancerBasicDetails = async (req, res) => {
  try {
    const freelancerId = req.params.freelancerId;
    const freelancer = await Freelancer.findById(freelancerId);
    const profile = await FreelancerProfile.findOne({ freelancerId });

    if (!freelancer || !profile)
      return res.status(404).json({ message: "Freelancer or profile not found" });

    const basicDetails = {
      fullName: freelancer.registrationDetails.fullName,
      userName: profile.profileDetails.userName,
      email: freelancer.registrationDetails.email,
      gender: profile.profileDetails.gender,
      dob: profile.profileDetails.dob,
      phoneNumber: profile.profileDetails.phoneNumber,
      bioDescription: profile.profileDetails.bioDescription,
    };

    res.status(200).json(basicDetails);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.updateFreelancerBasicDetails = async (req, res) => {
  try {
    const freelancerId = req.params.freelancerId;
    const { userName, gender, dob, phoneNumber, bioDescription } = req.body;

    const freelancer = await Freelancer.findById(freelancerId);
    const profile = await FreelancerProfile.findOne({ freelancerId });

    if (!freelancer || !profile)
      return res.status(404).json({ message: "Freelancer or profile not found" });

    if (userName) freelancer.profileDetails.userName = userName;
    if (gender) profile.profileDetails.gender = gender;
    if (dob) profile.profileDetails.dob = dob;
    if (phoneNumber) profile.profileDetails.phoneNumber = phoneNumber;
    if (bioDescription) profile.profileDetails.bioDescription = bioDescription;
    await profile.save();

    res.status(200).json({ message: "Basic details updated" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getProfessionalDetails = async (req, res) => {
  try {
    const { freelancerId } = req.params;

    const profile = await FreelancerProfile.findOne({ freelancerId });

    if (!profile) {
      return res.status(404).json({ message: "Freelancer profile not found" });
    }

    const professionalDetails = {
      primarySkillset: profile.profileDetails.primarySkillset,
      experience: profile.profileDetails.experience,
      toolsAndTechnologies: profile.profileDetails.toolsAndTechnologies,
      socialMedia: profile.profileDetails.socialMedia
    };

    res.status(200).json(professionalDetails);
  } catch (error) {
    res.status(500).json({ message: "Error fetching professional details", error });
  }
};

exports.updateProfessionalDetails = async (req, res) => {
  try {
    const { freelancerId } = req.params;
    const {
      primarySkillset,
      experience,
      toolsAndTechnologies,
      socialMedia
    } = req.body;

    const profile = await FreelancerProfile.findOne({ freelancerId });

    if (!profile) {
      return res.status(404).json({ message: "Freelancer profile not found" });
    }

    profile.profileDetails.primarySkillset = primarySkillset;
    profile.profileDetails.experience = experience;
    profile.profileDetails.toolsAndTechnologies = toolsAndTechnologies;
    profile.profileDetails.socialMedia = socialMedia;

    await profile.save();

    res.status(200).json({ message: "Professional details updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating professional details", error });
  }
};


exports.getFreelancerHeaderInfo = async (req, res) => {
  try {
    const freelancerId = req.params.freelancerId; // 👈 Make sure it matches your route param
    const freelancer = await Freelancer.findById(freelancerId);
    const profile = await FreelancerProfile.findOne({ freelancerId });

    if (!freelancer || !profile) {
      return res.status(404).json({ message: "Freelancer or profile not found" });
    }

    const header = {
      fullName: freelancer.registrationDetails.fullName,
      userName: profile.profileDetails.userName,
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
