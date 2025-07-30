const MeetingEvent = require('./meetingModel');
const mongoose = require("mongoose");
// Create meeting
exports.createMeetingEvent = async (req, res) => {
  try {
    const clientId = req.clientId;

    const {
      freelancerId,
      freelancerName,
      clientName,
      clientDesignation,
      eventTitle,
      startTime,
      endTime
    } = req.body;

    // Auto-generate meetingId
    const meetingId = `MEET${Math.floor(1000 + Math.random() * 9000)}`;

    const newMeeting = await MeetingEvent.create({
      meetingId,
      clientId,
      clientName,
      clientDesignation,
      freelancerId,
      freelancerName,
      eventTitle,
      startTime,
      endTime,
      status: 'Scheduled',
      deleted: false
    });

    res.status(201).json({ message: 'Meeting created', meeting: newMeeting });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create meeting', details: err.message });
  }
};



exports.getAllMeetingEvents = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const userType = req.user?.role?.toLowerCase();

    if (!userId || !userType) {
      return res.status(400).json({ message: "Missing user identity" });
    }

    const filter = {
      deleted: false,
    };

    if (userType === 'client') {
      filter.clientId = userId;
    } else if (userType === 'freelancer') {
      filter.freelancerId = userId;
    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    const meetings = await MeetingEvent.find();

    return res.status(200).json({
      totalMeetings: meetings.length,
      meetings:meetings,
    });

  } catch (error) {
    console.error("Error fetching meetings:", error);
    return res.status(500).json({ message: "Failed to fetch meetings" });
  }
};









// Soft delete a meeting
exports.deleteMeetingEvent = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const clientId = req.clientId;

    const result = await MeetingEvent.findOneAndUpdate(
      { _id: meetingId, clientId },
      { deleted: true },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ error: 'Meeting not found or unauthorized' });
    }

    res.status(200).json({ message: 'Meeting deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
};

// Update meeting status (e.g., completed/rejected)
exports.updateMeetingStatus = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { status } = req.body;
    const clientId = req.clientId;

    if (!['scheduled', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await MeetingEvent.findOneAndUpdate(
      { _id: meetingId, clientId },
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Meeting not found or unauthorized' });
    }

    res.status(200).json({ message: 'Status updated', meeting: updated });
  } catch (err) {
    res.status(500).json({ error: 'Status update failed', details: err.message });
  }
};
