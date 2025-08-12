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
router.get("/jobPost/:jobId/applicant-list", identifier, jobPostController.getJobApplicants);
router.put('/jobPost/:jobId/applicants/:freelancerId/status', identifier, jobPostController.updateApplicantStatus);

router.get('/client/jobs/shortlisted/summary', identifier, jobPostController.getShortlistedSummary);
router.get('/client/job/:jobId/shortlisted-details', identifier, jobPostController.getShortlistedDetails);


router.get('/client/jobs/rejected/summary', identifier, jobPostController.getRejectedSummary);
router.get('/client/jobs/rejected/details', identifier, jobPostController.getRejectedDetails);





// routes/freelancer.js
router.get("/freelancer/jobs", identifier, jobPostController.getAllJobs);
router.get("/freelancer/job/:jobId", identifier, jobPostController.getJobById);


router.post('/freelancer/job/apply', identifier, jobPostController.applyToJob);
router.delete('/freelancer/:freelancerId/job/:jobId/withdraw', identifier, jobPostController.withdrawApplication);
// Route: Get all jobs a specific freelancer has applied to
router.get("/jobs/applied", identifier, jobPostController.getAppliedJobs);


router.get("/job/is-applied/:freelancerId/:jobId", identifier, jobPostController.getAppliedJobById);



router.post('/freelancer/save-jobpost', identifier,jobPostController.saveJobpost);
router.delete('/freelancer/unsave-jobpost', identifier,jobPostController.unsaveJobpost);
router.get('/freelancer/saved-jobposts', identifier,jobPostController.getSavedJobposts);


module.exports = router;
