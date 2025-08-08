const JobPost = require("../JobPosts/jobPostModel");

exports.getAllClientJobPosts = async (req, res) => {
  try {
    const jobPosts = await JobPost.find()
      .populate({
        path: 'clientId',
        select: 'registrationDetails.fullName registrationDetails.email',
      })
      .populate({
        path: 'companyId',
        select: 'companyDetails.companyName companyDetails.companyLogo companyDetails.companyAddress',
      })
      .sort({ createdAt: -1 });

    const formatted = jobPosts.map(post => ({
      _id: post._id,
      jobId: post.jobId,
      jobTitle: post.jobTitle,
      jobCategory: post.jobCategory,
      jobType: post.jobType,
      location: post.location,
      jobDescription: post.jobDescription,
      applyByDate: post.applyByDate,
      postedOn: post.postedOn,
      status: post.status,
      verifiedByAdmin: post.verifiedByAdmin || false,

      postedBy: post.clientId
        ? {
            fullName: post.clientId.registrationDetails.fullName,
            email: post.clientId.registrationDetails.email,
          }
        : {
            fullName: 'Unknown',
            email: 'Unknown'
          },

      company: post.companyId
        ? {
            companyName: post.companyId.companyDetails.companyName,
            companyAddress: post.companyId.companyDetails.companyAddress,
            companyLogo: post.companyId.companyDetails.companyLogo,
          }
        : {
            companyName: 'Unknown',
            companyAddress: 'Unknown',
            companyLogo: { fileName: '', url: '' }
          }
    }));

    res.status(200).json({ success: true, jobPosts: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getJobPostById = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await JobPost.findById(jobId)
      .populate({
        path: 'clientId',
        select: 'registrationDetails.fullName registrationDetails.email',
      })
      .populate({
        path: 'companyId',
        model: 'Company', // full company details
      });

    if (!job) {
      return res.status(404).json({ message: 'Job post not found' });
    }

    // Convert Mongoose doc to plain JS object
    const jobObj = job.toObject();

    // Construct postedBy from clientId.registrationDetails if available
    const postedBy = jobObj.clientId
      ? {
          fullName: jobObj.clientId.registrationDetails?.fullName || 'Unknown',
          email: jobObj.clientId.registrationDetails?.email || 'Unknown',
        }
      : {
          fullName: 'Unknown',
          email: 'Unknown',
        };

    // Rename and restructure response
    const jobDetails = {
      ...jobObj,
      postedBy,
      clientProfile: jobObj.clientId || null,
      company: jobObj.companyId || null,
    };

    // Remove original fields to avoid duplication
    delete jobDetails.clientId;
    delete jobDetails.companyId;

    res.status(200).json({
      success: true,
      jobDetails,
    });
  } catch (error) {
    console.error('Error in getJobPostById:', error);
    res.status(500).json({ message: 'Error fetching job post', error });
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


exports.getAllJobApplicantsAcrossJobs = async (req, res) => {
  try {
    const jobPosts = await JobPost.find()
      .populate({
        path: 'clientId',
        select: 'registrationDetails.fullName registrationDetails.email',
      })
      .populate({
        path: 'companyId',
        select: 'companyDetails.companyName companyDetails.companyLogo companyDetails.companyAddress',
      })
      .populate({
        path: 'applicants.freelancerId',
        select: 'registrationDetails.fullName registrationDetails.email',
      })
      .sort({ createdAt: -1 });

    // Collect all applicants from all jobs into one flat array
    const allApplicants = [];
    jobPosts.forEach((job) => {
      if (Array.isArray(job.applicants)) {
        job.applicants.forEach((applicant) => {
          const freelancer = applicant.freelancerId || {};

          allApplicants.push({
            jobId: job.jobId || null,
            jobTitle: job.jobTitle || 'Unknown',
            clientName: job.clientId?.registrationDetails?.fullName || 'Unknown',
            clientEmail: job.clientId?.registrationDetails?.email || 'Unknown',
            companyName: job.companyId?.companyDetails?.companyName || 'Unknown',
            companyLogo: job.companyId?.companyDetails?.companyLogo || null,

            freelancerName: freelancer.registrationDetails?.fullName || 'Unknown',
            freelancerEmail: freelancer.registrationDetails?.email || 'Unknown',

            appliedAt: applicant.appliedAt || null,
            applicationStatus: applicant.status || 'Unknown',
          });
        });
      }
    });

    return res.status(200).json({
      success: true,
      totalApplicants: allApplicants.length,
      applicants: allApplicants,
    });
  } catch (error) {
    console.error('Error fetching applicants:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};



