const mongoose = require('mongoose');

const SavedJobpostSchema = new mongoose.Schema(
  {
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Freelancer',
      required: true,
    },
    jobPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPost',
      required: true,
    },
    saved: {
      type: Boolean,
      default: true, // always true logically, but for extensibility
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SavedJobpost', SavedJobpostSchema);
