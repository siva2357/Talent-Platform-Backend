const express = require("express");
const router = express.Router();
const jobPostController = require("./jobPostController");
const { identifier } = require('../Middleware/identification');





// Apply `identifier("client")` to all client-restricted routes
// ✔ Fixed order - put static route before dynamic :id
router.post("/jobPost/create", identifier, jobPostController.createJobPost);
router.get("/jobPosts/by-client", identifier, jobPostController.getJobsByClient);
router.get("/jobPost/closed", identifier, jobPostController.getClosedJobsByClient); // ⬅ MUST be before /:id
router.get("/jobPost/:id", identifier, jobPostController.getClientJobPostById);

router.put("/jobPost/update/:id", identifier, jobPostController.updateJobPost);
router.put("/jobPost/close/:id", identifier, jobPostController.closeJobPost);
router.put("/jobPost/reopen/:id", identifier, jobPostController.reopenJobPost);
router.delete("/jobPost/delete/:id", identifier, jobPostController.deleteJobPost);



// routes/freelancer.js
router.get("/freelancer/jobs", identifier, jobPostController.getAllJobs);
router.get("/freelancer/job/:jobId", identifier, jobPostController.getJobById);
router.post("/freelancer/job/apply/:freelancerId", identifier, jobPostController.applyForJob);
router.delete("/job/withdraw/:freelancerId/:jobId", identifier, jobPostController.withdrawApplication);
router.get("/jobs/applied/:freelancerId", identifier, jobPostController.getAppliedJobs);
router.get("/job/is-applied/:freelancerId/:jobId", identifier, jobPostController.getAppliedJobById);



// routes/client.js
router.get("/client/jobPost/applicants/:clientId", identifier, jobPostController.getJobApplicantsByClient);
router.get("/client/jobPost/applicants/:clientId/:jobId/:freelancerId",identifier, jobPostController.getJobApplicants);



module.exports = router;
