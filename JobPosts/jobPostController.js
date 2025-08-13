const JobPost = require("./jobPostModel");
const ClientProfile = require("../Profile-Details/clientProfileModel");
const Company = require("../Company/companyModel");
const mongoose = require("mongoose");
const Client = require('../Authentication/clientModel');
const FreelancerProfile = require('../Profile-Details/freelancerProfileModel');
const { sendNotification } = require("../Middleware/notificationHelper"); // adjust path as needed
const SavedJobpost = require('./savedJobPostModel'); // adjust path as needed
const MeetingEvent = require('../Meetings/meetingModel'); // adjust path as needed
const OfferLetter= require('../Offer-letter/offerLetterModel'); // adjust path as needed


exports.createJobPost = async (req, res) => {
  try {
    const { jobId, jobTitle, jobType, jobCategory, experience, salary, vacancy,
            location, qualification, jobDescription, applyByDate } = req.body;

    const clientId = req.clientId;
    if (!clientId || !mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ message: "Invalid client ID format" });
    }

    const client = await Client.findById(clientId);
    if (!client) return res.status(404).json({ message: "Client not found" });

    const clientProfile = await ClientProfile.findOne({ clientId });
    const fullName = clientProfile?.profileDetails?.fullName;
    if (!fullName) {
      return res.status(400).json({ message: "Client profile is incomplete" });
    }

    const companyName = clientProfile?.profileDetails?.companyName;
    const company = await Company.findOne({ "companyDetails.companyName": companyName });
    if (!company) return res.status(404).json({ message: "Associated company not found" });

    const formattedDescription = typeof jobDescription === "object"
      ? JSON.stringify(jobDescription)
      : jobDescription;

const newJobPost = new JobPost({
  clientId,
  companyId: company._id,
      jobId,
     jobTitle,
    jobType,
    jobCategory,
    experience,
    salary,
    vacancy,
    location,
    qualification,
    jobDescription: formattedDescription,
    applyByDate,
});

    await newJobPost.save();

    res.status(201).json({ message: "Job posted successfully", job: newJobPost });

  } catch (error) {
    console.error("Error creating job post:", error);
    res.status(500).json({ message: "Error creating job post", error: error.message });
  }
};

exports.updateJobPost = async (req, res) => {
  try {
    const jobId = req.params.id;
    const clientId = req.clientId; // ✅ from middleware

    let updateData = { ...req.body };

    // 🚫 Prevent _id from being updated
    if ('_id' in updateData) {
      delete updateData._id;
    }

    // ✅ Optional: Convert jobDescription if needed
    if (updateData.jobDescription && typeof updateData.jobDescription === "object") {
      updateData.jobDescription = JSON.stringify(updateData.jobDescription);
    }

    const job = await JobPost.findOneAndUpdate(
      { _id: jobId, clientId },
      { $set: updateData },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ message: "Job post not found or unauthorized" });
    }

    res.status(200).json({ message: "Job post updated successfully", job });

  } catch (error) {
    res.status(500).json({ message: "Error updating job post", error: error.message });
  }
};

exports.closeJobPost = async (req, res) => {
  try {
    const jobId = req.params.id;
    const clientId = req.clientId;

    const job = await JobPost.findOneAndUpdate(
      {
        _id: jobId,
        clientId,
        status: "Open", // Only allow closing if status is "Open"
      },
      { $set: { status: "Closed" } },
      { new: true }
    );

    if (!job) {
      return res.status(400).json({ message: "Job post not found, unauthorized, or not in Open status" });
    }

    res.status(200).json({ message: "Job post closed successfully", job });
  } catch (error) {
    res.status(500).json({ message: "Error closing job post", error: error.message });
  }
};

exports.reopenJobPost = async (req, res) => {
  try {
    const jobId = req.params.id;
    const clientId = req.clientId;

    const job = await JobPost.findOneAndUpdate(
      { _id: jobId, clientId },
      { $set: { status: "Open" } },
      { new: true }
    );

    if (!job) return res.status(404).json({ message: "Job post not found or unauthorized" });

    res.status(200).json({ message: "Job post reopened successfully", job });
  } catch (error) {
    res.status(500).json({ message: "Error reopening job post", error: error.message });
  }
};

exports.deleteJobPost = async (req, res) => {
  try {
    const jobId = req.params.id;
    const clientId = req.clientId;

    const job = await JobPost.findOne({ _id: jobId, clientId });

    if (!job) return res.status(404).json({ message: "Job post not found or unauthorized" });
    if (job.status !== "Closed") {
      return res.status(400).json({ message: "Only closed job posts can be deleted" });
    }

    await JobPost.findByIdAndDelete(jobId);
    res.status(200).json({ message: "Job post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting job post", error: error.message });
  }
};

exports.getJobsByClient = async (req, res) => {
  try {
    const clientId = req.clientId;

    const jobs = await JobPost.find({
      clientId: new mongoose.Types.ObjectId(clientId),
    });

    return res.status(200).json({
      totalJobPosts: jobs.length,
      jobPosts: jobs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching client jobs",
      error: error.message,
    });
  }
};

exports.getClientJobPostById = async (req, res) => {
  try {
    const jobId = req.params.id;
    const clientId = req.clientId; // from middleware

    // Populate company details
 const jobPost = await JobPost.findById(jobId)
      .populate('companyId', 'companyDetails.companyName companyDetails.companyAddress companyDetails.companyLogo');

    if (!jobPost) return res.status(404).json({ message: 'Job post not found' });

    if (!jobPost.clientId.equals(clientId)) {
      return res.status(403).json({ message: 'Unauthorized access to this job post' });
    }

    res.status(200).json(jobPost);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch job details: ' + error.message });
  }
};

exports.getClosedJobsByClient = async (req, res) => {
  try {
    const clientId = req.clientId;

    const closedJobs = await JobPost.find(
      { clientId, status: "Closed" },
      { jobId: 1, jobTitle: 1, status: 1 }
    ).lean();

    return res.status(200).json({
      total: closedJobs.length,
      jobs: closedJobs,
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching closed jobs",
      error: error.message,
    });
  }
};


exports.getJobApplicantsByClient = async (req, res) => {
  try {
    const clientId = req.clientId;

    const jobPosts = await JobPost.find({
      clientId: new mongoose.Types.ObjectId(clientId),
      status: "Open",
    }).select("jobId jobTitle jobCategory jobType applicants");

    const jobPostSummary = jobPosts.map(job => ({
      _id: job._id,
      jobId: job.jobId,
      jobTitle: job.jobTitle,
      jobCategory: job.jobCategory,
      jobType: job.jobType,
      totalApplicants: (job.applicants || []).length
    }));

    return res.status(200).json({
      totalJobPosts: jobPostSummary.length,
      jobPosts: jobPostSummary
    });

  } catch (error) {
    console.error("Error fetching applicants by client:", error);
    res.status(500).json({ message: "Failed to fetch applicants", error: error.message });
  }
};


exports.getJobApplicants = async (req, res) => {
  try {
    const clientId = req.clientId;
    const { jobId } = req.params;

    if (!jobId || !clientId) {
      return res.status(400).json({ message: "Missing clientId or jobId" });
    }

    // Fetch the job post
    const jobPost = await JobPost.findOne({
      _id: new mongoose.Types.ObjectId(jobId),
      clientId: new mongoose.Types.ObjectId(clientId),
    });

    if (!jobPost) {
      return res.status(403).json({ message: "Unauthorized or job not found" });
    }

    const freelancerIds = jobPost.applicants.map(app => app.freelancerId);

    // Fetch freelancer profiles
    const profiles = await FreelancerProfile.find({
      freelancerId: { $in: freelancerIds }
    });

    const profileMap = {};
    profiles.forEach(profile => {
      profileMap[profile.freelancerId.toString()] = profile.profileDetails;
    });

    // Fetch meetings for this job and freelancers
    const meetings = await MeetingEvent.find({
      jobId,
      freelancerId: { $in: freelancerIds }
    });
    const meetingMap = {};
    meetings.forEach(m => {
      meetingMap[m.freelancerId.toString()] = true; // any meeting exists
    });

    // Fetch offer letters for this job and freelancers
// Fetch offer letters for this job and freelancers
const offers = await OfferLetter.find({
  jobPostId: jobId,   // <- make sure this matches your schema
  freelancerId: { $in: freelancerIds }
});
const offerMap = {};
offers.forEach(o => {
  offerMap[o.freelancerId.toString()] = true; // offer exists
});

    // Map final response
    const applicants = jobPost.applicants.map(app => {
      const profile = profileMap[app.freelancerId?.toString()] || {};

      return {
        freelancerId: app.freelancerId || null,
        profileImage: profile.profilePicture?.url || null,
        fullName: profile.fullName || '',
        gender: profile.gender || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        appliedAt: app.appliedAt || null,
        status: app.status || '',
        offerLetter: offerMap[app.freelancerId?.toString()] ?? false, // real-time
        interviewScheduled: meetingMap[app.freelancerId?.toString()] ?? false, // real-time
        interviewCompleted:  meetingMap[app.freelancerId?.toString()] ?? false
      };
    });

    return res.status(200).json({
      jobTitle: jobPost.jobTitle,
      totalApplicants: applicants.length,
      applicants,
    });

  } catch (error) {
    console.error("Error fetching applicants:", error);
    res.status(500).json({ message: "Failed to fetch applicants", error: error.message });
  }
};


exports.updateApplicantStatus = async (req, res) => {
  try {
    const { jobId, freelancerId } = req.params;
    const { status } = req.body; // Expected: "Shortlisted" or "Rejected"

    if (!["Shortlisted", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const job = await JobPost.findOne({
      _id: jobId,
      clientId: req.clientId
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found or unauthorized" });
    }

    const applicant = job.applicants.find(app =>
      app.freelancerId.toString() === freelancerId
    );

    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    applicant.status = status;
    await job.save();

    return res.status(200).json({ message: `Applicant marked as ${status}` });
  } catch (error) {
    console.error("Update applicant status error:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
};



exports.getShortlistedSummary = async (req, res) => {
  try {
    const clientId = req.clientId;

    // Find all open jobs for this client
    const jobs = await JobPost.find({ clientId, status: "Open" });

    if (!jobs.length) return res.status(404).json({ message: "No open jobs found for client" });

const jobPosts = jobs.map(job => {
  const shortlisted = job.applicants.filter(app => app.status === "Shortlisted");

  return {
    jobPostId: job._id,
    jobId: job.jobId,
    jobTitle: job.jobTitle,
    jobCategory: job.jobCategory,
    shortlistedApplicants: shortlisted.length, // ✅ full data if needed
  };
});


    return res.status(200).json({
      totalJobs: jobPosts.length,
      jobPosts
    });
  } catch (err) {
    console.error("Fetch shortlisted details error:", err);
    res.status(500).json({ message: "Error fetching shortlisted details" });
  }
};

exports.getShortlistedDetails = async (req, res) => {
  try {
    const clientId = req.clientId;
    const { jobId } = req.params;

    // Find the job by jobId and clientId, ensure status is Open
    const job = await JobPost.findOne({ _id: jobId, clientId, status: "Open" });
    if (!job) return res.status(404).json({ message: "Job not found or not open" });

    // Filter shortlisted applicants
    const shortlisted = job.applicants.filter(app => app.status === "Shortlisted");

    // Fetch freelancer profile details for each shortlisted applicant
    const shortlistedWithDetails = await Promise.all(shortlisted.map(async (app) => {
      const profile = await FreelancerProfile.findOne({ freelancerId: app.freelancerId }).select('profileDetails fullName email phoneNumber');
      return {
        freelancerId: app.freelancerId,
        appliedAt: app.appliedAt,
        status: app.status,
        fullName: profile?.profileDetails.fullName || null,
        email: profile?.profileDetails.email || null,
        phoneNumber: profile?.profileDetails.phoneNumber || null,
        profilePicture: profile?.profileDetails.profilePicture || null,
        // add more fields as needed
      };
    }));

    // Return job info plus shortlisted applicants with profiles
    return res.status(200).json({
      jobId: job._id,
      jobTitle: job.jobTitle,
      totalApplicants: job.applicants.length,
      shortlistedApplicants: shortlistedWithDetails
    });
  } catch (err) {
    console.error("Fetch shortlisted details error:", err);
    res.status(500).json({ message: "Error fetching shortlisted details" });
  }
};


exports.getRejectedSummary = async (req, res) => {
  try {
    const clientId = req.clientId;

    // Find all open jobs for this client
    const jobs = await JobPost.find({ clientId, status: "Open" });

    if (!jobs.length) return res.status(404).json({ message: "No open jobs found for client" });

    // Count total rejected applicants across all jobs
    let totalRejected = 0;
    jobs.forEach(job => {
      const rejectedCount = job.applicants.filter(app => app.status === "Rejected").length;
      totalRejected += rejectedCount;
    });

    return res.status(200).json({
      totalJobs: jobs.length,
      totalRejectedApplicants: totalRejected
    });
  } catch (err) {
    console.error("Fetch rejected summary error:", err);
    res.status(500).json({ message: "Error fetching rejected summary" });
  }
};

exports.getRejectedDetails = async (req, res) => {
  try {
    const clientId = req.clientId;

    // Find all open jobs for this client
    const jobs = await JobPost.find({ clientId, status: "Open" });

    if (!jobs.length) return res.status(404).json({ message: "No open jobs found for client" });

    const jobPosts = jobs.map(job => {
      const rejected = job.applicants.filter(app => app.status === "Rejected");

      return {
        jobId: job._id,
        jobTitle: job.jobTitle,
        totalApplicants: job.applicants.length,
        rejectedApplicants: rejected.map(app => ({
          freelancerId: app.freelancerId,
          appliedAt: app.appliedAt,
          status: app.status
        }))
      };
    });

    return res.status(200).json({
      totalJobs: jobPosts.length,
      jobPosts
    });
  } catch (err) {
    console.error("Fetch rejected details error:", err);
    res.status(500).json({ message: "Error fetching rejected details" });
  }
};







exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await JobPost.find({ status: "Open" })
      .populate("clientId", "registrationDetails")
      .populate("companyId", "companyDetails");

    if (!jobs.length) return res.status(404).json({ message: "No open jobs found" });

    res.status(200).json({
      totalJobPosts: jobs.length,
      jobPosts: jobs,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching jobs", error: error.message });
  }
};

exports.closeJobPost = async (req, res) => {
  try {
    const jobId = req.params.id;
    const clientId = req.clientId;

    const job = await JobPost.findOneAndUpdate(
      {
        _id: jobId,
        clientId,
        status: "Open", // Only allow closing if status is "Open"
      },
      { $set: { status: "Closed" } },
      { new: true }
    );

    if (!job) {
      return res.status(400).json({ message: "Job post not found, unauthorized, or not in Open status" });
    }

    res.status(200).json({ message: "Job post closed successfully", job });
  } catch (error) {
    res.status(500).json({ message: "Error closing job post", error: error.message });
  }
};

exports.reopenJobPost = async (req, res) => {
  try {
    const jobId = req.params.id;
    const clientId = req.clientId;

    const job = await JobPost.findOneAndUpdate(
      { _id: jobId, clientId },
      { $set: { status: "Open" } },
      { new: true }
    );

    if (!job) return res.status(404).json({ message: "Job post not found or unauthorized" });

    res.status(200).json({ message: "Job post reopened successfully", job });
  } catch (error) {
    res.status(500).json({ message: "Error reopening job post", error: error.message });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await JobPost.findById(jobId)
      .populate("companyId", "companyDetails")
      .lean();

    if (!job) return res.status(404).json({ message: "Job post not found" });

    const clientProfile = await ClientProfile.findOne({ clientId: job.clientId._id }).lean();
    job.clientProfile = clientProfile || {};

    res.status(200).json(job);
  } catch (error) {
    res.status(500).json({ message: "Error fetching job post", error: error.message });
  }
};




exports.applyToJob = async (req, res) => {
  try {
    const { jobId, freelancerId } = req.body;

    const job = await JobPost.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const alreadyApplied = job.applicants.some(app => app.freelancerId.toString() === freelancerId);
    if (alreadyApplied) return res.status(400).json({ message: "Already applied to this job" });

    const freelancer = await FreelancerProfile.findOne({ freelancerId }).select("profileDetails.fullName");
    if (!freelancer) return res.status(404).json({ message: "Freelancer not found" });

    job.applicants.push({ freelancerId });
    job.totalApplicants = job.applicants.length;
    await job.save();

    await sendNotification({
      userId: job.clientId,
      userType: "Client",
      title: "New Job Application",
      message: `${freelancer.profileDetails.fullName} has applied to your job: ${job.jobId} - ${job.jobTitle}`,
      link: `/admin/jobs/applicants/${job._id}`
    });

    res.status(200).json({ message: "Applied successfully" });
  } catch (error) {
    console.error("Apply Error:", error);
    res.status(500).json({ message: "Error applying to job", error });
  }
};

exports.withdrawApplication = async (req, res) => {
  try {
    const { freelancerId, jobId } = req.params;

    const job = await JobPost.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job post not found" });

    const index = job.applicants.findIndex(app => app.freelancerId.toString() === freelancerId);
    if (index === -1) return res.status(400).json({ message: "You have not applied for this job" });

    const appliedAt = new Date(job.applicants[index].appliedAt);
    const now = new Date();
    const diffMinutes = (now - appliedAt) / 60000;

    if (diffMinutes > 60) {
      return res.status(400).json({ message: "Withdrawal period (1 hour) has expired" });
    }

    const freelancer = await FreelancerProfile.findOne({ freelancerId }).select("profileDetails.fullName");
    if (!freelancer) return res.status(404).json({ message: "Freelancer not found" });

    job.applicants.splice(index, 1);
    job.totalApplicants = job.applicants.length;
    await job.save();

    await sendNotification({
      userId: job.clientId,
      userType: "Client",
      title: "Application Withdrawn",
      message: `${freelancer.profileDetails.fullName} has withdrawn from your job: ${job.jobId} - ${job.jobTitle}`,
      link: `/admin/jobs/applicants/${job._id}`
    });

    res.status(200).json({ message: "Application withdrawn successfully" });
  } catch (error) {
    console.error("Withdraw Error:", error);
    res.status(500).json({ message: "Error withdrawing application", error });
  }
};

exports.getAppliedJobs = async (req, res) => {
  try {
    // Use freelancerId from auth middleware (e.g., req.freelancerId), not URL params
    const freelancerId = req.freelancerId;

    if (!freelancerId) {
      return res.status(401).json({ message: "Unauthorized: Freelancer ID missing" });
    }

    const appliedJobs = await JobPost.find({ "applicants.freelancerId": freelancerId })
      .populate("clientId")
      .populate("companyId")
      .select("-applicants");

    if (!appliedJobs.length) {
      return res.status(200).json({ count: 0, jobs: [] });
    }

    res.status(200).json({ count: appliedJobs.length, jobs: appliedJobs });
  } catch (error) {
    res.status(500).json({ message: "Error fetching applied jobs", error });
  }
};


exports.getAppliedJobById = async (req, res) => {
  try {
    const { freelancerId, jobId } = req.params;

    const job = await JobPost.findOne({
      _id: jobId,
      "applicants.freelancerId": freelancerId,
    });

    if (!job) {
      return res.status(200).json({ isApplied: false });
    }

    res.status(200).json({ isApplied: true });
  } catch (error) {
    res.status(500).json({ message: "Error checking applied job", error });
  }
};









// Example: get saved jobs for a freelancer
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



exports.saveJobpost = async (req, res) => {
  try {
    const freelancerId = req.freelancerId; // from auth middleware
    const { jobPostId } = req.body;

    console.log('saveJobpost called:', { freelancerId, jobPostId });

    if (!mongoose.Types.ObjectId.isValid(freelancerId) || !mongoose.Types.ObjectId.isValid(jobPostId)) {
      return res.status(400).json({ success: false, message: 'Invalid freelancerId or jobPostId' });
    }

    const exists = await SavedJobpost.findOne({ freelancerId, jobPostId });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Job already saved' });
    }

    const savedJob = await SavedJobpost.create({ freelancerId, jobPostId });
    return res.status(201).json({ success: true, data: savedJob });
  } catch (error) {
    console.error('Error saving jobpost:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.unsaveJobpost = async (req, res) => {
  try {
    const freelancerId = req.freelancerId; // from auth middleware
    const { jobPostId } = req.body;

    console.log('unsaveJobpost called:', { freelancerId, jobPostId });

    if (!mongoose.Types.ObjectId.isValid(freelancerId) || !mongoose.Types.ObjectId.isValid(jobPostId)) {
      return res.status(400).json({ success: false, message: 'Invalid freelancerId or jobPostId' });
    }

    const deleted = await SavedJobpost.findOneAndDelete({ freelancerId, jobPostId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Saved job not found' });
    }

    return res.status(200).json({ success: true, message: 'Job removed from saved list' });
  } catch (error) {
    console.error('Error unsaving jobpost:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


exports.getSavedJobposts = async (req, res) => {
  try {
    const freelancerId = req.freelancerId; // from middleware

    if (!mongoose.Types.ObjectId.isValid(freelancerId)) {
      return res.status(400).json({ success: false, message: 'Invalid freelancerId' });
    }

const savedJobs = await SavedJobpost.find({ freelancerId, saved: true })
  .populate({
    path: 'jobPostId',
    populate: {
      path: 'companyId',        // populate companyId inside jobPostId
      select: 'companyDetails', // select the companyDetails field (adjust fields as needed)
    }
  })
  .lean();


    const response = savedJobs.map(item => ({
      savedJobId: item._id,
      jobPost: item.jobPostId,
      saved: item.saved,
      savedAt: item.createdAt,
    }));

    return res.status(200).json({
      success: true,
      total: response.length,
      data: response,
    });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};


