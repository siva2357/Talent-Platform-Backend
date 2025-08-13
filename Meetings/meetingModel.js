const mongoose = require("mongoose");

const meetingEventSchema = new mongoose.Schema({
  meetingId: { type: String, required: true, unique: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  clientName: { type: String, required: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "Freelancer", required: true },
  freelancerName: { type: String, required: true },
  jobId: { type: String, required: true },
  jobTitle: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  meetingJoinUrl: { type: String, required: true },
  status: {
    type: String,
    enum: ["Scheduled", "Completed", "Pending", "Not Completed"],
    default: "Scheduled"
  },
}, { timestamps: true });

module.exports = mongoose.model("MeetingEvent", meetingEventSchema);
