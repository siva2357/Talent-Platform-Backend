const Client = require('../Authentication/clientModel');
const ClientProfile = require('../Profile-Details/clientProfileModel');
const JobPost = require('../JobPosts/jobPostModel'); // Your JobPost schema
const Freelancer = require('../Authentication/freelancerModel');
const FreelancerProfile = require('../Profile-Details/freelancerProfileModel');
const Portfolio = require('../Portfolio/portfolioModel');

exports.getAllVerifiedClients = async (req, res) => {
  try {
    const clients = await Client.find({
      role: 'client',
      'registrationDetails.verified': true
    }).select(
      '-registrationDetails.password ' +
      '-registrationDetails.verificationCode ' +
      '-registrationDetails.verificationCodeValidation ' +
      '-registrationDetails.forgotPasswordCode ' +
      '-registrationDetails.forgotPasswordCodeValidation'
    );

    res.status(200).json({
      totalClients: clients.length,
      clients
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching verified clients',
      error: err.message
    });
  }
};


exports.getClientProfileById = async (req, res) => {
  try {
    const { clientId } = req.params;

    // Fetch client profile
    const profile = await ClientProfile.findOne({ clientId })
      .select('-__v') // remove mongoose internal field
      .lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Client profile not found'
      });
    }

    // Fetch related job posts with only required fields
    const jobPosts = await JobPost.find({ clientId })
      .select('jobId jobTitle jobCategory verifiedByAdmin adminReviewedOn jobDescription totalApplicants')
      .sort({ createdAt: -1 }) // optional: sort by latest
      .lean();

    res.status(200).json({
      success: true,
      profile: {
        profileDetails: profile,
        jobPosts
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching client profile',
      error: err.message
    });
  }
};


exports.getAllVerifiedFreelancers = async (req, res) => {
  try {
    const freelancers = await Freelancer.find({
      role: 'freelancer',
      'registrationDetails.verified': true
    }).select(
      '-registrationDetails.password ' +
      '-registrationDetails.verificationCode ' +
      '-registrationDetails.verificationCodeValidation ' +
      '-registrationDetails.forgotPasswordCode ' +
      '-registrationDetails.forgotPasswordCodeValidation'
    );

    res.status(200).json({
      totalFreelancers: freelancers.length,
      freelancers
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching verified clients',
      error: err.message
    });
  }
};


exports.getFreelancerProfileById = async (req, res) => {
  try {
    const { freelancerId } = req.params;
    const profile = await FreelancerProfile.findOne({ freelancerId })
      .select('-__v') // remove mongoose internal field
      .lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Freelancer profile not found'
      });
    }

const projects = await Portfolio.find({}) // Or filter if needed
  .select('projectDetails')  // Only project details
  .sort({ createdAt: -1 })   // Latest first
  .lean();

res.status(200).json({
  success: true,
  profile: {
    profileDetails: profile,
    projects: projects // Return freelancer project uploads
  }
});
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching client profile',
      error: err.message
    });
  }
};
