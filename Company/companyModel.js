const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({

  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }, // Reference to Admin model
  totalCount:{type:Number},
  companyDetails: {
    companyId: { type: String, required: true },
    companyLogo: { fileName: { type: String, required: true }, url: { type: String, required: true } },
    companyName: { type: String, required: true },
    companyAddress: { type: String, required: true },
  }
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);
