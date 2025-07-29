const express = require("express");
const router = express.Router();
const jobPostController = require("./jobPostController");
const { identifier } = require('../Middleware/identification');



// JOB POST routes
router.post("/jobPost/create", identifier, jobPostController.createJobPost);
router.put("/jobPost/:id/update", identifier, jobPostController.updateJobPost);
router.put("/jobPost/:id/close", identifier, jobPostController.closeJobPost);
router.put("/jobPost/:id/reopen", identifier, jobPostController.reopenJobPost);
router.delete("/jobPost/:id/delete", identifier, jobPostController.deleteJobPost);
router.get("/jobPosts/by-client", identifier, jobPostController.getJobsByClient);
router.get("/jobPosts/closed", identifier, jobPostController.getClosedJobsByClient);
router.get("/jobPost/:id", identifier, jobPostController.getClientJobPostById);


router.get("/jobPosts/applicants", identifier, jobPostController.getJobApplicantsByClient);
router.get("/client/jobPost/applicants/:clientId/:jobId", identifier, jobPostController.getJobApplicants);

// routes/freelancer.js
router.get("/freelancer/jobs", identifier, jobPostController.getAllJobs);
router.get("/freelancer/job/:jobId", identifier, jobPostController.getJobById);
router.post("/freelancer/job/apply/:freelancerId", identifier, jobPostController.applyForJob);
router.delete("/job/withdraw/:freelancerId/:jobId", identifier, jobPostController.withdrawApplication);
router.get("/jobs/applied/:freelancerId", identifier, jobPostController.getAppliedJobs);
router.get("/job/is-applied/:freelancerId/:jobId", identifier, jobPostController.getAppliedJobById);




router.get("/pending-by-client/:clientId", identifier, jobPostController.getPendingJobsByClient);
router.patch("/admin/approve/:jobId", identifier, jobPostController.approveJobPost);
router.patch("/admin/reject/:jobId", identifier, jobPostController.rejectJobPost);


module.exports = router;
