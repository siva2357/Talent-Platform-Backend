const mongoose = require("mongoose");

const applicantSchema = new mongoose.Schema(
  {
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "Freelancer", required: true },
    appliedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["Pending", "Shortlisted", "Rejected"], default: "Pending" },
  },
  { _id: false }
);

const contractSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true},
    contractId: { type: String, required: true, unique: true},
    contractTitle: { type: String, required: true},
    contractCategory: { type: String, required: true},
    contractLocation: { type: String, required:true},
    contractDescription: { type: String, required: true },
    contractType: { type: String, enum: ["Fixed", "Hourly", "Weekly"], required: true},
    contractStart: { type: Date, validate: { validator: function (val) { return this.contractType === "Fixed" ? !!val : true;}, message: "contractStart is required for Fixed contracts"}},
    contractEnding: { type: Date,
      validate: [
        { validator: function (val) { return this.contractType === "Fixed" ? !!val : true;}, message: "contractEnding is required for Fixed contracts"},
        { validator: function (val) { if (this.contractStart && val) { return val > this.contractStart} return true;},message: "contractEnding must be after contractStart"}
    ]},
    hourlyRate: { type: Number, validate: { validator: function (val) { return this.contractType === "Hourly" ? val > 0 : true;}, message: "hourlyRate must be greater than 0 for Hourly contracts"}},
    weeklyRate: { type: Number, validate: { validator: function (val) { return this.contractType === "Weekly" ? val > 0 : true;}, message: "weeklyRate must be greater than 0 for Weekly contracts"}},
    totalBudget: { type: Number, validate: { validator: function (val) { return this.contractType === "Fixed" ? val > 0 : true;},  message: "totalBudget must be greater than 0 for Fixed contracts"}},
    postedOn: { type: Date, default: Date.now },
    applyByDate: {type: Date, required: true, validate: { validator: function (val) { return this.isNew ? val > new Date() : true;},message: "Apply By Date must be in the future"}},
    status: { type: String, enum: ["Pending", "Open", "Closed", "Rejected"], default: "Pending" },
    adminReviewedOn: { type: Date },
    verifiedByAdmin: { type: Boolean, default: false },
    applicants: [applicantSchema],
    totalApplicants: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contract", contractSchema);
