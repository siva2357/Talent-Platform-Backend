const mongoose = require("mongoose");

const freelancerProfileSchema = mongoose.Schema(
  {
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Freelancer",
      required: true
    },
    profileDetails: {
      // Section 1: Personal Information
      profilePicture: {
        fileName: { type: String, required: true },
        url: { type: String, required: true }
      },
      fullName: { type: String, required: true },
      userName: { type: String, required: true },
      gender: { type: String, required: true },
      dob: { type: Date }, // optional
      email: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      bioDescription: { type: String, required: true },

      // Section 2: Professional & Skills Info
      primarySkillset: { type: String, required: true },
      experience: { type: Number, required: true }, // in years
      toolsAndTechnologies: [{ type: String }], // e.g., ["React", "Node.js"]
      portfolioLinks: [{ type: String }], // e.g., ["https://portfolio.com"]
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
