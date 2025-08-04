const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  freelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Freelancer', required: true }, // Reference to Seeker model
  projectDetails: { // Fixed syntax by adding a colon
    file: {
      fileName: { type: String, required: true },
      url: { type: String, required: true }
    },
    projectTitle: { type: String, required: true },
    projectType: { type: String, required: true, enum: ['Art Concepts', '3D Environment', '3D Animations', 'Game Development', 'AR/VR']
    },
    projectDescription: { type: String, required: true },
    softwares: [{ type: String,required: true }],
    tags: [{ type: String,required: true }],  
    }
}, { timestamps: true }); // Adds createdAt & updatedAt automatically

module.exports = mongoose.model('Portfolio', uploadSchema);
