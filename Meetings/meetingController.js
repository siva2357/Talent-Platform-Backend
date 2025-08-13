const MeetingEvent = require('./meetingModel');
const mongoose = require("mongoose");
const { sendNotification } = require("../Middleware/notificationHelper"); 
const JobPost = require('../JobPosts/jobPostModel');
const Freelancer = require('../Authentication/freelancerModel');

exports.createMeeting = async (req, res) => {
  try {
    const { userId, role } = req.user || {};
    const { freelancerId, startTime, endTime, meetingJoinUrl, jobId,meetingId } = req.body; // removed meetingId

    if (role !== 'client') {
      return res.status(403).json({ success: false, message: "Only clients can create meetings" });
    }

    const job = await JobPost.findOne({ _id: jobId, clientId: userId });
    if (!job) {
      return res.status(400).json({ success: false, message: "Invalid job ID or you don't own this job" });
    }

    const freelancer = await Freelancer.findById(freelancerId);
    if (!freelancer) return res.status(404).json({ success: false, message: "Freelancer not found" });

    const meetingData = {
      meetingId,
      clientId: userId,
      clientName: req.user.name || 'Client',
      freelancerId,
      freelancerName: freelancer.registrationDetails.fullName,
      jobId: job._id,
      jobPostId: job.jobId,
      jobTitle: job.jobTitle,
      startTime,
      endTime,
      meetingJoinUrl,
      status: "Scheduled"
    };

    // Create the meeting
    const newMeeting = await MeetingEvent.create(meetingData);

    // Only after meeting creation, update the applicant's interviewScheduled flag
    await JobPost.updateOne(
      { _id: jobId, "applicants.freelancerId": freelancerId },
      { $set: { "applicants.$.interviewScheduled": true } }
    );

    // Notify freelancer
    await sendNotification({
      userId: newMeeting.freelancerId,
      userType: "Freelancer",
      title: "New Meeting Scheduled",
      message: `${newMeeting.clientName} has scheduled a meeting for your job: ${newMeeting.jobTitle} at ${newMeeting.startTime}`,
      link: `${newMeeting.meetingJoinUrl}`
    });

    return res.status(201).json({
      success: true,
      message: "Meeting created successfully and freelancer notified",
      meeting: newMeeting // frontend uses _id
    });

  } catch (err) {
    console.error("Create meeting error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};




exports.getAllMeetingsByClient = async (req, res) => {
  try {
    const { userId, role } = req.user;
    if (role !== "client") {
      return res.status(403).json({ message: "Only clients can access their meetings" });
    }

    const meetings = await MeetingEvent.find({ clientId: userId});
    return res.status(200).json({ totalMeetings: meetings.length, meetings });
  } catch (err) {
    console.error("Fetch client meetings error:", err);
    return res.status(500).json({ message: "Failed to fetch meetings" });
  }
};


exports.getMeetingByIdForClient = async (req, res) => {
  try {
    const { userId, role } = req.user;
    if (role !== "client") {
      return res.status(403).json({ message: "Only clients can access their meetings" });
    }

    const meeting = await MeetingEvent.findOne({ _id: req.params.id, clientId: userId });
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    return res.status(200).json({ success: true, meeting });
  } catch (err) {
    console.error("Get meeting by ID error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------- FREELANCER --------------------

exports.getAllMeetingsByFreelancer = async (req, res) => {
  try {
    const { userId, role } = req.user;
    if (role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancers can access their meetings" });
    }

    const meetings = await MeetingEvent.find({ freelancerId: userId });

    // If no meetings exist, reset interviewScheduled to false for all jobs where this freelancer applied
    if (meetings.length === 0) {
      await JobPost.updateMany(
        { "applicants.freelancerId": userId },
        { $set: { "applicants.$.interviewScheduled": false } }
      );
    }

    return res.status(200).json({ totalMeetings: meetings.length, meetings });
    
  } catch (err) {
    console.error("Fetch freelancer meetings error:", err);
    return res.status(500).json({ message: "Failed to fetch meetings" });
  }
};


// Get a single meeting by ID (freelancer)
exports.getMeetingByIdForFreelancer = async (req, res) => {
  try {
    const { userId, role } = req.user;
    if (role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancers can access their meetings" });
    }

    const meeting = await MeetingEvent.findOne({ _id: req.params.id, freelancerId: userId });

    if (!meeting) {
      // Reset interviewScheduled for this freelancer for all related jobs
      await JobPost.updateMany(
        { "applicants.freelancerId": userId },
        { $set: { "applicants.$.interviewScheduled": false } }
      );

      return res.status(404).json({ message: "Meeting not found, interview flags reset" });
    }

    return res.status(200).json({ success: true, meeting });

  } catch (err) {
    console.error("Get freelancer meeting by ID error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};




exports.updateMeetingById = async (req, res) => {
  try {
    const { userId, role } = req.user || {};
    const { jobId, startTime, endTime, meetingJoinUrl } = req.body;
    if (role !== 'client') {
      return res.status(403).json({ message: "Only clients can update meetings" });
    }
    if (jobId) {
      const job = await JobPost.findOne({ _id: jobId, clientId: userId });
      if (!job) {
        return res.status(400).json({ message: "Invalid job ID or you don't own this job" });
      }
      req.body.jobTitle = job.title; // auto-update jobTitle
    }

    const updatedMeeting = await MeetingEvent.findOneAndUpdate(
      { _id: req.params.id, clientId: userId },
      req.body,
      { new: true }
    );

    if (!updatedMeeting) {
      return res.status(404).json({ message: "Meeting not found or unauthorized" });
    }

    await sendNotification({
      userId: updatedMeeting.freelancerId,
      userType: "Freelancer",
      title: "Meeting Updated",
      message: `${updatedMeeting.clientName} has updated the meeting for job: ${updatedMeeting.jobTitle}. New time: ${updatedMeeting.startTime}`,
      link: `${updatedMeeting.meetingJoinUrl}`
    });

    return res.status(200).json({ success: true, meeting: updatedMeeting });

  } catch (err) {
    console.error("Update meeting error:", err);
    return res.status(500).json({ message: "Update failed" });
  }
};



exports.deleteMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    if (role !== 'client') {
      return res.status(403).json({ message: "Only clients can delete meetings" });
    }

    // Find and delete the meeting completely
    const deletedMeeting = await MeetingEvent.findOneAndDelete({
      _id: id,
      clientId: userId
    });

    if (!deletedMeeting) {
      return res.status(404).json({ message: "Meeting not found or unauthorized" });
    }

    // Check if any other meetings exist for this freelancer & job
    const remainingMeetings = await MeetingEvent.countDocuments({
      jobId: deletedMeeting.jobId,
      freelancerId: deletedMeeting.freelancerId
    });

    // Only reset interviewScheduled if no meetings remain
    if (remainingMeetings === 0) {
      await JobPost.updateOne(
        { _id: deletedMeeting.jobId, "applicants.freelancerId": deletedMeeting.freelancerId },
        { $set: { "applicants.$.interviewScheduled": false } }
      );
    }

    return res.status(200).json({ message: "Meeting deleted", meeting: deletedMeeting });
  } catch (err) {
    console.error("Delete meeting error:", err);
    return res.status(500).json({ message: "Delete failed" });
  }
};


exports.updateMeetingStatus = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { _id, status } = req.body;

    // Only clients can update
    if (role !== "client") {
      return res.status(403).json({ success: false, message: "Only clients can update meeting status" });
    }

    // Validate meeting ID
    if (!_id || typeof _id !== "string" || !mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ success: false, message: "Invalid or missing meeting ID" });
    }

    // Validate status
    const allowedStatuses = ["Completed", "Not Completed", "Scheduled"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid or missing status value" });
    }

    // Update only the status field
    const meeting = await MeetingEvent.findOneAndUpdate(
      { _id, clientId: userId },
      { status },
      { new: true }
    );

    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    // Sync applicant flags in JobPost
    const updateData = {};
    if (status === "Completed") updateData["applicants.$.interviewCompleted"] = true;
    else if (status === "Scheduled") updateData["applicants.$.interviewScheduled"] = true;
    else if (status === "Not Completed") updateData["applicants.$.interviewCompleted"] = false;

    if (Object.keys(updateData).length) {
      try {
        await JobPost.updateOne(
          { _id: meeting.jobId, "applicants.freelancerId": meeting.freelancerId },
          { $set: updateData }
        );
      } catch (err) {
        console.warn("Failed to sync applicant flags:", err.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Meeting status updated to ${meeting.status} and applicant flags synced`,
      meeting
    });

  } catch (err) {
    console.error("Update meeting status error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};








