const mongoose = require("mongoose");

const offerLetterSchema = new mongoose.Schema(
  {
    jobPostId: { type: mongoose.Schema.Types.ObjectId, ref: "JobPost", required: true },
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "Freelancer", required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },

    offerMessage: { type: String, required: true },
    offeredSalary: { type: String, required: true },
    joiningDate: { type: Date, required: true },

    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending"
    },

    sentOn: { type: Date, default: Date.now },
    respondedOn: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model("OfferLetter", offerLetterSchema);
