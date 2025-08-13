const express = require('express');
const router = express.Router();
const { identifier } = require('../Middleware/identification');
const { signout,getAdminById,getAdminProfileById} = require('./adminController');
const userProfileController = require('../Admin/userProfileController'); // path as needed
const jobPostsController = require('../Admin/jobPostsController'); // path as needed

const meetingController = require('../Admin/meetingController'); // path as needed



// STATIC ROUTES FIRST
router.get('/admin/clients', identifier, userProfileController.getAllVerifiedClients);
router.get('/admin/client/:clientId/profile-details', identifier, userProfileController.getClientProfileById);


router.get('/admin/freelancers', identifier, userProfileController.getAllVerifiedFreelancers);
router.get('/admin/freelancer/:freelancerId/profile-details', identifier, userProfileController.getFreelancerProfileById);

// -------------------- Admin ROUTES --------------------
router.get('/admin/meetings', identifier, meetingController.getAllMeetingsForAdmin);

router.get('/admin/all-jobs', identifier, jobPostsController.getAllClientJobPosts);
router.get('/admin/job-post/:jobId/job-details', identifier, jobPostsController.getJobPostById);
router.patch('/admin/job-posts/:jobId/approve', identifier, jobPostsController.approveJobPost);
router.patch('/admin/job-posts/:jobId/reject', identifier, jobPostsController.rejectJobPost);
router.get('/admin/job-applicants/all', identifier,jobPostsController.getAllJobApplicantsAcrossJobs);

router.post('/auth/admin/signout', identifier, signout);

// DYNAMIC ROUTES LAST
router.get('/admin/:id', identifier, getAdminById);
router.get('/admin/:id/profile', identifier, getAdminProfileById);

module.exports = router;
