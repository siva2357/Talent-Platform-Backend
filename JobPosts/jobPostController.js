const JobPost = require("./jobPostModel");
const ClientProfile = require("../Profile-Details/clientProfileModel");
const Company = require("../Company/companyModel");
const mongoose = require("mongoose");
const Client = require('../Authentication/clientModel');
const Freelancer = require('../Authentication/freelancerModel');

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
    })
      .select("jobTitle applicants")
      .populate("applicants.freelancerId", "name email location designation");

    const jobPostDetails = jobPosts.map(job => {
      const applicants = (job.applicants || []).map(app => {
        const freelancer = app.freelancerId;
        return {
          freelancerId: freelancer._id,
          name: freelancer.name,
          email: freelancer.email,
          location: freelancer.location,
          designation: freelancer.designation,
        };
      });

      return {
        _id: job._id,
        jobTitle: job.jobTitle,
        totalApplicants: applicants.length,
        applicants,
      };
    });

    return res.status(200).json({
      totalJobPosts: jobPostDetails.length,
      jobPosts: jobPostDetails
    });

  } catch (error) {
    console.error("Error fetching applicants by client:", error);
    res.status(500).json({ message: "Failed to fetch applicants", error: error.message });
  }
};




exports.getJobApplicants = async (req, res) => {
  try {
    const { clientId, jobId } = req.params;

    const jobPost = await JobPost.findOne({
      _id: new mongoose.Types.ObjectId(jobId),
      clientId: new mongoose.Types.ObjectId(clientId),
    })
      .populate({
        path: "applicants.freelancerId",
        model: "Freelancer",
        select: "registrationDetails profileDetails",
      });

    if (!jobPost) {
      return res.status(403).json({ message: "Unauthorized or not found" });
    }

    const applicants = jobPost.applicants.map(app => ({
      freelancerId: app.freelancerId?._id,
      fullName: app.freelancerId?.profileDetails?.fullName,
      email: app.freelancerId?.registrationDetails?.email,
      phoneNumber: app.freelancerId?.profileDetails?.phoneNumber,
      appliedAt: app.appliedAt,
    }));

    return res.status(200).json({
      jobTitle: jobPost.jobTitle,
      totalApplicants: applicants.length,
      applicants
    });

  } catch (error) {
    console.error("Error fetching applicants:", error);
    res.status(500).json({ message: "Failed to fetch applicants", error: error.message });
  }
};





exports.getPendingJobsByClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    const jobs = await JobPost.find({ clientId, status: "Pending" })
      .populate("clientId")
      .populate("companyId");

    if (!jobs.length) return res.status(404).json({ message: "No pending jobs found" });

    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

exports.approveJobPost = async (req, res) => {
  try {
    const { jobId } = req.params;

    const updatedJob = await JobPost.findOneAndUpdate(
      { _id: jobId, status: "Pending" },
      {
        status: "Open",
        adminReviewedOn: new Date(),
        verifiedByAdmin: true
      },
      { new: true }
    );

    if (!updatedJob) return res.status(404).json({ message: "Job not found or already reviewed" });

    res.status(200).json({ message: "Job approved and opened", job: updatedJob });
  } catch (err) {
    res.status(500).json({ message: "Error approving job", error: err });
  }
};

exports.rejectJobPost = async (req, res) => {
  try {
    const { jobId } = req.params;

    const updatedJob = await JobPost.findOneAndUpdate(
      { _id: jobId, status: "Pending" },
      {
        status: "Rejected",
        adminReviewedOn: new Date(),
        verifiedByAdmin: false
      },
      { new: true }
    );

    if (!updatedJob) return res.status(404).json({ message: "Job not found or already reviewed" });

    res.status(200).json({ message: "Job rejected", job: updatedJob });
  } catch (err) {
    res.status(500).json({ message: "Error rejecting job", error: err });
  }
};







// ✅ Get all job posts with status = 'open' (For freelancers)
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await JobPost.find({ status: "open" })
      .populate("clientId", "registrationDetails") // Only basic info
      .populate("companyId", "companyDetails");

    if (!jobs.length) return res.status(404).json({ message: "No open jobs found" });

    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching jobs", error: error.message });
  }
};

// ✅ Get full job post by ID (used by freelancers)
exports.getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await JobPost.findById(jobId)
      .populate("clientId", "registrationDetails")
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
// Apply for a job for freelancers
exports.applyForJob = async (req, res) => {
  try {
    const { freelancerId } = req.params;
    const { jobId } = req.body;

    const jobPost = await JobPost.findById(jobId);
    if (!jobPost) return res.status(404).json({ message: "Job post not found" });

    const alreadyApplied = jobPost.applicants.some(
      app => app.freelancerId.toString() === freelancerId
    );
    if (alreadyApplied) {
      return res.status(400).json({ message: "You have already applied for this job" });
    }

    jobPost.applicants.push({ freelancerId, appliedAt: new Date() });
    await jobPost.save();

    res.status(200).json({ message: "Application submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error applying for job", error });
  }
};


exports.withdrawApplication = async (req, res) => {
  try {
    const { freelancerId, jobId } = req.params;

    const jobPost = await JobPost.findById(jobId);
    if (!jobPost) return res.status(404).json({ message: "Job post not found" });

    const applicantIndex = jobPost.applicants.findIndex(
      app => app.freelancerId.toString() === freelancerId
    );
    if (applicantIndex === -1) {
      return res.status(400).json({ message: "You have not applied for this job" });
    }

    const appliedAt = new Date(jobPost.applicants[applicantIndex].appliedAt);
    const now = new Date();
    const diffMinutes = (now - appliedAt) / 60000;

    if (diffMinutes > 60) {
      return res.status(400).json({ message: "Withdrawal period has expired" });
    }

    jobPost.applicants.splice(applicantIndex, 1);
    await jobPost.save();

    res.status(200).json({ message: "Application withdrawn successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error withdrawing application", error });
  }
};

// Get all applied jobs for a specific freelancer
exports.getAppliedJobs = async (req, res) => {
  try {
    const { freelancerId } = req.params;

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


//Get individual job appled list by spefic freleancers
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
