const mongoose = require('mongoose');

const SavedTalentSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FreelancerProfile',
      required: true
    },
    saved: { type: Boolean, default: true } // always true here logically, but kept for possible future use
  },
  { timestamps: true }
);

module.exports = mongoose.model('SavedTalent', SavedTalentSchema);
