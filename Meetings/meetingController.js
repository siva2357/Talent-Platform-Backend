const MeetingEvent = require('./meetingModel');
const mongoose = require("mongoose");


exports.createMeeting = async (req, res) => {
  try {
    const { userId, role } = req.user || {};
    
    if (role !== 'client') {
      return res.status(403).json({ success: false, message: "Only clients can create meetings" });
    }

    const meetingData = {
      ...req.body,
      clientId: new mongoose.Types.ObjectId(userId),
      deleted: false  // Ensure it's not soft-deleted on create
    };

    const newMeeting = await MeetingEvent.create(meetingData);

    return res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      meeting: newMeeting
    });
  } catch (err) {
    console.error("Create meeting error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


exports.getAllMeetings = async (req, res) => {
  try {
    const { userId, role } = req.user || {};

    if (!userId || !role) {
      return res.status(400).json({ message: "Missing user identity" });
    }

    const filter = { deleted: false };
    if (role === "client") {
      filter.clientId = new mongoose.Types.ObjectId(userId);
    } else if (role === "freelancer") {
      filter.freelancerId = new mongoose.Types.ObjectId(userId);
    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    const meetings = await MeetingEvent.find();
    return res.status(200).json({ totalMeetings: meetings.length, meetings:meetings });
  } catch (error) {
    console.error("Fetch meetings error:", error);
    return res.status(500).json({ message: "Failed to fetch meetings" });
  }
};


exports.getMeetingById = async (req, res) => {
  try {
    const meeting = await MeetingEvent.findById(req.params.id);
    if (!meeting) return res.status(404).json({ message: "Meeting not found" });

    return res.status(200).json({ success: true, meeting });
  } catch (err) {
    console.error("Get meeting by ID error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.updateMeetingById = async (req, res) => {
  try {
    const { userId, role } = req.user || {};

    if (role !== 'client') {
      return res.status(403).json({ message: "Only clients can update meetings" });
    }

    const updatedMeeting = await MeetingEvent.findOneAndUpdate(
      { _id: req.params.id, clientId: userId },
      req.body,
      { new: true }
    );

    if (!updatedMeeting) {
      return res.status(404).json({ message: "Meeting not found or unauthorized" });
    }

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



