const mongoose = require("mongoose");

const freelancerProfileSchema = mongoose.Schema(
  {
    freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: "Freelancer", required: true },
    profileDetails: {
      profilePicture: {
        fileName: { type: String, required: true },
        url: { type: String, required: true }
      },
      fullName: { type: String, required: true },
      userName: { type: String, required: true },
      gender: { type: String, required: true },
      dob: { type: Date }, 
      email: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      bioDescription: { type: String, required: true },
      primarySkillset: [{ type: String }],
      experience: { type: Number, required: true },
      toolsAndTechnologies: [{ type: String }], 
      socialMedia: [
        {
          platform: { type: String, required: true },
          url: { type: String, required: true }
        }
      ]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FreelancerProfile", freelancerProfileSchema);
