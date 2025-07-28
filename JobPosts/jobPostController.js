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
    const updateData = req.body;

    if (updateData.jobDescription && typeof updateData.jobDescription === "object") {
      updateData.jobDescription = JSON.stringify(updateData.jobDescription);
    }

    const job = await JobPost.findOneAndUpdate(
      { _id: jobId, clientId },
      { $set: updateData },
      { new: true }
    );

    if (!job) return res.status(404).json({ message: "Job post not found or unauthorized" });

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
      { _id: jobId, clientId },
      { $set: { status: "Closed" } },
      { new: true }
    );

    if (!job) return res.status(404).json({ message: "Job post not found or unauthorized" });

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

    const openJobs = await JobPost.find(
      {
        clientId: new mongoose.Types.ObjectId(clientId),
        status: "Open"
      },
      { jobId: 1, jobTitle: 1, status: 1, _id: 1 }
    );

    return res.status(200).json({
      totalOpenJobs: openJobs.length,
      jobPosts: openJobs,
    });

  } catch (error) {
    res.status(500).json({ message: "Error fetching open jobs", error: error.message });
  }
};


exports.getClientJobPostById = async (req, res) => {
  try {
    const jobId = req.params.id;
    const clientId = req.clientId; // from middleware

    const jobPost = await JobPost.findById(jobId);

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
      { jobId: 1, jobTitle: 1, status: 1, _id: 1 }
    );

    return res.status(200).json({
      totalJobPosts: closedJobs.length,
      jobPosts: closedJobs,
    });

  } catch (error) {
    res.status(500).json({ message: "Error fetching closed jobs", error: error.message });
  }
};










//Get all job listing for freelancers
exports.getAllJobs = async (req, res) => {
  try {
    const jobs = await JobPost.find().populate("clientId").populate("companyId", "companyDetails") // Fetch company details
    ;

console.log("Jobs after populate:", jobs); // Log the populated jobs

if (!jobs.length) return res.status(404).json({ message: "No job posts found" });

res.status(200).json(jobs);

  } catch (error) {
    // Enhanced error message
    res.status(500).json({ message: `Error fetching jobs: ${error.message}`, stack: error.stack });
  }
};



//Get individual Job details for  freelancer
// Controller
exports.getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await JobPost.findById(jobId)
      .populate("companyId", "companyDetails")
      .lean();

    if (!job) {
      return res.status(404).json({ message: "Job post not found" });
    }

    const clientProfile = await ClientProfile.findOne({ clientId: job.clientId }).lean();
    job.clientProfile = clientProfile || {};

    delete job.clientId;

    res.status(200).json(job);
  } catch (error) {
    console.error("Error fetching job post:", error);
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



//Get individual job applicants poste dby particular client for particular job
exports.getJobApplicantsByClient = async (req, res) => {
  try {
    const {clientId} = req.params;
    const jobPosts = await JobPost.find(
      { clientId: new mongoose.Types.ObjectId(clientId),"jobPostDetails.status": "Open"}).select("jobPostDetails applicants totalApplicants ");

    if (!jobPosts || jobPosts.length === 0) {
      console.log("No open job posts found for this recruiter");
      return res.status(200).json({ totalApplicants: 0, jobPosts: [] });
    }

    const jobPostDetails = jobPosts.map((jobPost) => {
    const totalApplicants = jobPost.applicants ? jobPost.applicants.length : 0;

      return {
        _id: jobPost._id,
        jobPostDetails: jobPost.jobPostDetails,
        totalApplicants: totalApplicants,
      };
    });

    return res.status(200).json({
      totalJobPosts: jobPostDetails.length, // Total number of job posts returned
      jobPosts: jobPostDetails,
    });

  } catch (error) {
    console.error("Error fetching job applicants by recruiter:", error);
    res.status(500).json({ message: "Error fetching job posts", error: error.message });
  }
};


//Get individual job applicant details 
exports.getJobApplicants = async (req, res) => {
  try {
    const { clientId, jobId, freelancerId } = req.params;

    console.log("Recruiter ID from request:", clientId);
    console.log("Job Post ID from request:", jobId);

    const jobPost = await JobPost.findOne({
      _id: new mongoose.Types.ObjectId(jobId),
     clientId: new mongoose.Types.ObjectId(clientId),
    })
    .populate({
      path: "applicants.freelancerId",
      model: "Freelancer",
      select: "registrationDetails",
    })
    .populate("companyId", "companyName location");

    if (!jobPost) {
      console.log("Job post not found or recruiter does not own this job");
      return res.status(403).json({ message: "Unauthorized access or job post not found" });
    }
    const totalApplicants = jobPost.applicants ? jobPost.applicants.length : 0;

    if (totalApplicants === 0) {
      console.log("No applicants found for this job post");
      return res.status(200).json({ totalApplicants, applicants: [] });
    }
    let freelancerDetails = null;
    if (freelancerId) {
      const freelancer = await Freelancer.findById(new mongoose.Types.ObjectId(freelancerId))
        .select("registrationDetails phone resume");
      if (!freelancer) {
        return res.status(404).json({ message: "Seeker not found" });
      }
      freelancerDetails = freelancer;
    }

    res.status(200).json({
      jobTitle: jobPost.jobPostDetails.jobTitle,
      totalApplicants, // ✅
      applicants: jobPost.applicants.map(app => ({
        freelancerId: app.freelancerId?._id,
        fullName: app.seekerId?.profileDetails?.fullName,
        email: app.seekerId?.registrationDetails?.email,
        phoneNumber: app.seekerId?.profileDetails?.phoneNumber,
        appliedAt: app.appliedAt
      })),
      freelancerDetails, 
    });

  } catch (error) {
    console.error("Error fetching applicants:", error);
    res.status(500).json({ message: "Error fetching applicants", error });
  }
};
