const mongoose = require("mongoose");

const clientProfileSchema = mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    profileDetails: {
      // Section 1: Personal Details
      profilePicture: {
        fileName: { type: String, required: true },
        url: { type: String, required: true }
      },
      fullName: { type: String, required: true },
      userName: { type: String, required: true },
      gender: { type: String, required: true },
      dob: { type: Date, required: true },
      email: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      address: { type: String, required: true },
      bioDescription: { type: String, required: true },

      // Section 2: Professional & Social Info
      companyName: { type: String, required: true },
      designation: { type: String, required: true },
      experience: { type: Number, required: true }, // in years
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

module.exports = mongoose.model("ClientProfile", clientProfileSchema);
