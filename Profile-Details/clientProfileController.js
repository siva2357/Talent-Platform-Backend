const Client = require('../Authentication/clientModel');
const ClientProfile = require('../Profile-Details/clientProfileModel');
const JobPost = require("../JobPosts/jobPostModel");


exports.createClientProfile = async (req, res) => {
  try {
    // Check if client is authenticated
    if (!req.clientId) {
      return res.status(401).json({ message: "Unauthorized: Client ID missing" });
    }

    // Ensure client exists
    const client = await Client.findById(req.clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Check if profile already exists
    const existingProfile = await ClientProfile.findOne({ clientId: req.clientId });
    if (existingProfile) {
      return res.status(400).json({ message: "Client profile already exists" });
    }

    // Extract default values from registration (if available)
    const { email, fullName} = client.registrationDetails || {};

    // Compose full profileDetails matching schema
    const profileDetails = {
      profilePicture: {
        fileName: req.body.profileDetails.profilePicture?.fileName,
        url: req.body.profileDetails.profilePicture?.url
      },
      fullName: fullName,
      userName: req.body.profileDetails.userName,
      email: email,
      gender: req.body.profileDetails.gender,
      dob: req.body.profileDetails.dob,
      phoneNumber: req.body.profileDetails.phoneNumber,
      address: req.body.profileDetails.address,
      bioDescription: req.body.profileDetails.bioDescription,
      companyName: req.body.profileDetails.companyName,
      designation: req.body.profileDetails.designation,
      experience: req.body.profileDetails.experience,
      socialMedia: req.body.profileDetails.socialMedia || [],
    };

    // Save profile
    const newProfile = new ClientProfile({
      clientId: req.clientId,
      profileDetails
    });

    await newProfile.save();

    res.status(201).json({ message: "Client profile created successfully", clientProfile: newProfile });
  } catch (error) {
    console.error("Create Client Profile Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getClientProfile = async (req, res) => {
  try {
    const clientId = req.params.clientId;
    if (!clientId) return res.status(400).json({ message: "Client ID is required" });

    const client = await Client.findById(clientId);
    const profile = await ClientProfile.findOne({ clientId });

    if (!client || !profile) {
      return res.status(404).json({ message: "Client profile not found" });
    }

    const { email, fullName, userName } = client.registrationDetails || {};
    profile.profileDetails.email = email;
    profile.profileDetails.fullName = fullName;
    profile.profileDetails.userName = userName;

    res.status(200).json(profile);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.updateClientProfile = async (req, res) => {
  try {
    if (!req.clientId) {
      return res.status(401).json({ message: "Unauthorized: Client ID is missing" });
    }

    const client = await Client.findById(req.clientId);
    const profile = await ClientProfile.findOne({ clientId: req.clientId });

    if (!client || !profile) {
      return res.status(404).json({ message: "Client profile not found" });
    }

    const updatedDetails = req.body.profileDetails;
    if (!updatedDetails) {
      return res.status(400).json({ message: "Profile details required" });
    }

    // Block any attempt to overwrite primary fields
    delete updatedDetails.email;
    delete updatedDetails.fullName;

    // Merge allowed fields only
    profile.profileDetails = {
      ...profile.profileDetails,
      ...updatedDetails
    };

    await profile.save();
    res.status(200).json(profile);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.deleteClientAccount = async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (role !== "client") {
      return res.status(403).json({ message: "Only clients can delete their own account" });
    }

    // 1️⃣ Check if client exists
    const found = await Client.findById(userId);
    if (!found) {
      return res.status(404).json({ message: "Client not found" });
    }

    // 2️⃣ Delete client profile
    await ClientProfile.deleteMany({ clientId: userId });

    // 3️⃣ Delete all job posts by client
    await JobPost.deleteMany({ clientId: userId });

    // 4️⃣ Delete client account
    await Client.findByIdAndDelete(userId);

    return res.status(200).json({ message: "Account, profile, and all job posts deleted successfully" });
  } catch (error) {
    console.error("Error deleting client account:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.getClientBasicDetails = async (req, res) => {
  try {
    const clientId = req.params.clientId;

    const profile = await ClientProfile.findOne({ clientId });
    if (!profile) {
      return res.status(404).json({ message: "Client profile not found" });
    }

    const pd = profile.profileDetails;

    res.status(200).json({
      fullName: pd.fullName,
      userName: pd.userName,
      email: pd.email,
      gender: pd.gender,
      dob: pd.dob,
      phoneNumber: pd.phoneNumber,
      address: pd.address,
      bioDescription: pd.bioDescription,
      companyName: pd.companyName,
      designation: pd.designation,
      experience: pd.experience,
      socialMedia: pd.socialMedia,
      profilePicture: pd.profilePicture,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.updateClientBasicDetails = async (req, res) => {
  try {
    const clientId = req.params.clientId;

    const {
      fullName,
      userName,
      email,
      gender,
      dob,
      phoneNumber,
      address,
      bioDescription,
      companyName,
      designation,
      experience,
      socialMedia,
      profilePicture,
    } = req.body;

    // Validate required fields
    const requiredFields = {
      fullName,
      userName,
      email,
      gender,
      dob,
      phoneNumber,
      address,
      bioDescription,
      companyName,
      designation,
      experience,
      socialMedia,
      profilePicture,
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "") ||
        (Array.isArray(value) && value.length === 0)
      ) {
        return res.status(400).json({ message: `${key} is required` });
      }
    }

    const profile = await ClientProfile.findOne({ clientId });
    if (!profile) {
      return res.status(404).json({ message: "Client profile not found" });
    }

    const pd = profile.profileDetails;

    // Apply updates
    pd.fullName = fullName;
    pd.userName = userName;
    pd.email = email;
    pd.gender = gender;
    pd.dob = dob;
    pd.phoneNumber = phoneNumber;
    pd.address = address;
    pd.bioDescription = bioDescription;
    pd.companyName = companyName;
    pd.designation = designation;
    pd.experience = experience;
    pd.socialMedia = socialMedia;
    pd.profilePicture = profilePicture;

    await profile.save();

    res.status(200).json({ message: "Client profile updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.getClientHeaderInfo = async (req, res) => {
  try {
    const clientId = req.params.clientId;
    const client = await Client.findById(clientId);
    const profile = await ClientProfile.findOne({ clientId });

    if (!client || !profile) return res.status(404).json({ message: "Client or profile not found" });

    const header = {
        fullName: client.registrationDetails.fullName,
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

exports.getClientSocialMedia = async (req, res) => {
  try {
    const clientId = req.params.clientId;
    const profile = await ClientProfile.findOne({ clientId }, { 'profileDetails.socialMedia': 1, _id: 0 });

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

    const profile = await ClientProfile.findOne({ clientId: req.clientId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    profile.profileDetails.socialMedia = socialMedia;
    await profile.save();

    res.status(200).json({ message: "Social media updated", socialMedia });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.getClientProfilePicture = async (req, res) => {
  try {
    const clientId = req.params.clientId;
    const profile = await ClientProfile.findOne({ clientId }, { 'profileDetails.profilePicture': 1, _id: 0 });

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    res.status(200).json({ profilePicture: profile.profileDetails.profilePicture });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateClientProfilePicture = async (req, res) => {
  try {
    const clientId = req.params.clientId;
    const { profilePicture } = req.body;

    if (!profilePicture?.fileName || !profilePicture?.url) {
      return res.status(400).json({ message: "Invalid profile picture" });
    }

    const profile = await ClientProfile.findOne({ clientId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    profile.profileDetails.profilePicture = profilePicture;
    await profile.save();

    res.status(200).json({ message: "Profile picture updated", profilePicture });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getMyFullProfile = async (req, res) => {
  try {
    const { userId, role } = req.user;

    if (role !== "client") {
      return res.status(403).json({
        success: false,
        message: "Only clients can access their full profile"
      });
    }

    // Client details
    const client = await Client.findById(userId)
      .select(
        "registrationDetails.fullName registrationDetails.email registrationDetails.verified createdAt updatedAt -_id"
      )
      .lean();

    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    // Profile details
    const profileDoc = await ClientProfile.findOne({ clientId: userId })
      .select("-_id -clientId -__v")
      .lean();

    let flatProfile = {};
    if (profileDoc) {
      // Flatten the structure
      flatProfile = {
        ...(profileDoc.profileDetails || {}),
        createdAt: profileDoc.createdAt,
        updatedAt: profileDoc.updatedAt
      };

      // Remove `_id` from each socialMedia entry
      if (Array.isArray(flatProfile.socialMedia)) {
        flatProfile.socialMedia = flatProfile.socialMedia.map(({ _id, ...rest }) => rest);
      }
    }

    // Job posts
    const jobPosts = await JobPost.find({ clientId: userId })
      .select(
        "jobId jobTitle jobType totalApplicants location status postedOn updatedAt -_id"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: [
        {
          clientDetails: client,
          profileDetails: flatProfile,
          jobPosts
        }
      ]
    });
  } catch (error) {
    console.error("Error fetching client profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
      error: error.message
    });
  }
};




