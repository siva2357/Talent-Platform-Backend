const Client = require('../Authentication/clientModel');
const ClientProfile = require('../Profile-Details/clientProfileModel');

// CREATE
exports.createClientProfile = async (req, res) => {
  try {
    if (!req.clientId) {
      return res.status(401).json({ message: "Unauthorized: Client ID is missing" });
    }

    const client = await Client.findById(req.clientId);
    if (!client) return res.status(404).json({ message: "Client not found" });

    const existingProfile = await ClientProfile.findOne({ clientId: req.clientId });
    if (existingProfile) return res.status(400).json({ message: "Profile already exists" });

    const { email, fullName, userName } = client.registrationDetails || {};
    const profileDetails = {
      profilePicture: req.body.profileDetails.profilePicture || {},
      fullName: fullName || req.body.profileDetails.fullName,
      userName: userName || req.body.profileDetails.userName,
      email: email || req.body.profileDetails.email ,
      gender: req.body.profileDetails.gender,
      bioDescription: req.body.profileDetails.bioDescription,
      socialMedia: req.body.profileDetails.socialMedia || [],
    };

    const newProfile = new ClientProfile({
      clientId: req.clientId,
      profileDetails
    });

    await newProfile.save();
    res.status(201).json({ message: "Client profile created", clientProfile: newProfile });
  } catch (error) {
    console.error("Create profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET PROFILE BY CLIENT ID
exports.getClientProfile = async (req, res) => {
  try {
    const clientId = req.params.clientId;
    if (!clientId) return res.status(400).json({ message: "Client ID is required" });

    const client = await Client.findById(clientId);
    const profile = await ClientProfile.findOne({ clientId });

    if (!client || !profile) {
      return res.status(404).json({ message: "Client profile not found" });
    }

    profile.profileDetails.email = client.registrationDetails.email;
    profile.profileDetails.fullName = client.registrationDetails.fullName;
    profile.profileDetails.userName = client.registrationDetails.userName;

    res.status(200).json(profile);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// UPDATE
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

    const { profileDetails } = req.body;
    if (!profileDetails) return res.status(400).json({ message: "Profile details required" });

    // Remove protected fields
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

// DELETE
exports.deleteClientById = async (req, res) => {
  try {
    const clientId = req.params.clientId;
    const found = await Client.findById(clientId);
    if (!found) return res.status(404).json({ message: "Client not found" });

    await ClientProfile.deleteMany({ clientId });
    await Client.findByIdAndDelete(clientId);

    res.status(200).json({ message: "Client and profile deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// BASIC INFO
exports.getClientBasicDetails = async (req, res) => {
  try {
    const clientId = req.params.clientId;
    const client = await Client.findById(clientId);
    const profile = await ClientProfile.findOne({ clientId });

    if (!client || !profile) return res.status(404).json({ message: "Client or profile not found" });

    const basicDetails = {
      fullName: client.registrationDetails.fullName,
      userName: client.registrationDetails.userName,
      email: client.registrationDetails.email,
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
    const clientId = req.params.clientId;
    const { userName, gender, bioDescription } = req.body;

    const client = await Client.findById(clientId);
    const profile = await ClientProfile.findOne({ clientId });

    if (!client || !profile) return res.status(404).json({ message: "Client or profile not found" });

    if (userName) client.registrationDetails.userName = userName;
    await client.save();

    if (gender) profile.profileDetails.gender = gender;
    if (bioDescription) profile.profileDetails.bioDescription = bioDescription;
    await profile.save();

    res.status(200).json({ message: "Basic details updated" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// HEADER
exports.getClientHeaderInfo = async (req, res) => {
  try {
    const clientId = req.params.clientId;
    const client = await Client.findById(clientId);
    const profile = await ClientProfile.findOne({ clientId });

    if (!client || !profile) return res.status(404).json({ message: "Client or profile not found" });

    const header = {
      profile: {
        fullName: client.registrationDetails.fullName,
        profilePicture: {
          fileName: profile.profileDetails.profilePicture?.fileName || null,
          url: profile.profileDetails.profilePicture?.url || null
        }
      }
    };

    res.status(200).json(header);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// SOCIAL MEDIA
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

// PROFILE PICTURE
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
