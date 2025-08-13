const { required } = require("joi");
const mongoose = require("mongoose");

const meetingEventSchema = new mongoose.Schema({
  meetingId: { type: String, required: true},
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  clientName: { type: String, required: true },
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "Freelancer", required: true },
  freelancerName: { type: String, required: true },
  jobId:{type:String, required:true},
  jobPostId: { type: String, required: true },
  jobTitle: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  meetingJoinUrl: { type: String, required: true },
  status: {
    type: String,
    enum: ["Scheduled", "Completed", "Not Completed"],
    default: "Scheduled"
  },
}, { timestamps: true });

module.exports = mongoose.model("MeetingEvent", meetingEventSchema);
