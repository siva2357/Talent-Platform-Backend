
const MeetingEvent = require('../Meetings/meetingModel');





exports.getAllMeetingsForAdmin = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "admin") {
      return res.status(403).json({ message: "Only admins can access all meetings" });
    }

    const meetings = await MeetingEvent.find()
      .sort({ startTime: -1 });

    // Map meetings to only include relevant fields
    const filteredMeetings = meetings.map(m => ({
      meetingId: m.meetingId,
      clientId: m.clientId,
      clientName: m.clientName,
      freelancerId: m.freelancerId,
      freelancerName: m.freelancerName,
      jobId: m.jobId,
      jobPostId: m.jobPostId,
      jobTitle: m.jobTitle,
      startTime: m.startTime,
      endTime: m.endTime,
      status: m.status,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    }));

    return res.status(200).json({
      totalMeetings: filteredMeetings.length,
      meetings: filteredMeetings
    });
  } catch (err) {
    console.error("Fetch all meetings (admin) error:", err);
    return res.status(500).json({ message: "Failed to fetch meetings" });
  }
};

