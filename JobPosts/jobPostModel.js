const mongoose = require("mongoose");

const applicantSchema = new mongoose.Schema(
  {
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "Freelancer", required: true},
    appliedAt: { type: Date, default: Date.now},
  },
  { _id: false }
);

const jobPostSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true},
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true},

    jobId: {  type: String, required: true, unique: true},
    jobType: { type: String, required: true},
    jobTitle: { type: String, required: true, },
    jobCategory: { type: String, required: true},
    experience: {  type: String, required: true},
    salary: { type: String, required: true },
    vacancy: { type: String, required: true},
    location: { type: String, required: true},
    qualification: { type: String, required: true},
    jobDescription: { type: String, required: true},
    postedOn: { type: Date, default: Date.now},
    applyByDate: { type: Date,  required: true,
      validate: {
        validator: function (value) {
          return value > Date.now();
        },
        message: "Apply By Date must be in the future.",
      },
    },
    status: { type: String, enum: ["Open", "Closed"], default: "Open",
    },

    applicants: [applicantSchema],
    totalApplicants: { type: Number, default: 0},
    totalJobposts: { type: Number, default: 0},
  },
  { timestamps: true }
);

module.exports = mongoose.model("JobPost", jobPostSchema);
