const MeetingEvent = require('./meetingModel');
const mongoose = require("mongoose");
const { sendNotification } = require("../Middleware/notificationHelper"); 
const JobPost = require('../JobPosts/jobPostModel');
const Freelancer = require('../Authentication/freelancerModel');
const { v4: uuidv4 } = require('uuid');

exports.createMeeting = async (req, res) => {
  try {
    const { userId, role } = req.user || {};
    const { freelancerId, startTime, endTime, meetingJoinUrl, jobId } = req.body;

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
  meetingId: uuidv4(),
  clientId: userId,
  clientName: req.user.name || 'Client',
  freelancerId: freelancerId,
  freelancerName: freelancer.registrationDetails.fullName, // fixed
  jobId: job.jobId,
  jobTitle: job.jobTitle,
  startTime,
  endTime,
  meetingJoinUrl,
  status: "Scheduled"
};

    const newMeeting = await MeetingEvent.create(meetingData);

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
      meeting: newMeeting
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

    const meetings = await MeetingEvent.find({ clientId: userId, deleted: false });
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

    const meeting = await MeetingEvent.findOne({ _id: req.params.id, clientId: userId, deleted: false });
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

    const meetings = await MeetingEvent.find({ freelancerId: userId});
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
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

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

    // If jobId is being updated, validate ownership
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

    // Notify freelancer about the update
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


// Soft Delete Meeting
exports.deleteMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    if (role !== 'client') {
      return res.status(403).json({ message: "Only clients can delete meetings" });
    }

    const deletedMeeting = await MeetingEvent.findOneAndUpdate(
      { _id: id, clientId: userId },
      { deleted: true },
      { new: true }
    );

    if (!deletedMeeting) {
      return res.status(404).json({ message: "Meeting not found or unauthorized" });
    }

    return res.status(200).json({ message: "Meeting deleted", meeting: deletedMeeting });
  } catch (err) {
    console.error("Delete meeting error:", err);
    return res.status(500).json({ message: "Delete failed" });
  }
};



