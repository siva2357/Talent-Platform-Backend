const OfferLetter = require("../Offer-letter/offerLetterModel");
const JobPost = require("../JobPosts/jobPostModel");
const ClientProfile = require('../Profile-Details/clientProfileModel');
const Company = require('../Company/companyModel');
const FreelancerProfile = require('../Profile-Details/freelancerProfileModel');
const Freelancer = require('../Authentication/freelancerModel')
const generateOfferLetterPDF = require('../Utils/generateOfferLetter'); // adjust path if needed
const transporter = require('../Middleware/sendMail'); // your mail setup file
require('dotenv').config(); // to load your email env values
const path = require('path'); // for PDF path
const moment = require('moment');


// exports.sendOffer = async (req, res) => {
//   try {
//     const { jobPostId, freelancerId, offerMessage, offeredSalary, joiningDate } = req.body;
//     const clientId = req.clientId; // from auth middleware

//     // ✅ Check if an offer already exists for this freelancer and job
//     const existingOffer = await OfferLetter.findOne({ jobPostId, freelancerId });
//     if (existingOffer) {
//       return res.status(400).json({ message: "Offer already sent to this freelancer for this job." });
//     }

//     // ✅ Create and save new offer
//     const offer = new OfferLetter({
//       jobPostId,
//       freelancerId,
//       clientId,
//       offerMessage,
//       offeredSalary,
//       joiningDate
//     });

//     await offer.save();
//     res.status(201).json({ message: "Offer letter sent successfully", offer });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to send offer", error: error.message });
//   }
// };

exports.sendOffer = async (req, res) => {
  try {
    const { jobPostId, freelancerId, offerMessage, offeredSalary, joiningDate } = req.body;
    const clientId = req.clientId;

    // 1. Check if offer already exists
    const existingOffer = await OfferLetter.findOne({ jobPostId, freelancerId });
    if (existingOffer) {
      return res.status(400).json({ message: "Offer already sent to this freelancer for this job." });
    }

    // 2. Fetch job and freelancer data for PDF/email
    const job = await JobPost.findById(jobPostId);
    const freelancer = await Freelancer.findById(freelancerId); // Adjust if using custom User model
    const freelancerProfile = await FreelancerProfile.findOne({ freelancerId });
    const profileDetails = freelancerProfile?.profileDetails || {};

    const freelancerName = profileDetails.fullName || "Freelancer";
    const freelancerEmail = profileDetails.email || freelancer.email;

const client = await ClientProfile.findOne({ clientId });

if (!client) {
  return res.status(404).json({ message: "Client profile not found" });
}


const clientName = client.profileDetails.fullName;
const clientDesignation = client.profileDetails.designation;
const clientCompanyName = client.profileDetails.companyName;



const moment = require('moment');
const sentOnFormatted = moment().format('MMMM D, YYYY');

const pdfData = {
  freelancerName,
  offerMessage,
  jobTitle: job?.jobTitle || "Job Title",
  clientCompanyName,
  offeredSalary,
  joiningDateFormatted: moment(joiningDate).format("MMMM D, YYYY"),
  sentOnFormatted: moment().format("MMMM D, YYYY"),
  clientName,
  clientDesignation
};




const outputPath = path.join(__dirname, `../Offers/Offer-${freelancerId}-${Date.now()}.pdf`);
await generateOfferLetterPDF(pdfData, outputPath);


    // 4. Send email
    await transporter.sendMail({
      from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
      to: freelancerEmail,
      subject: "You have received a new job offer!",
      html: `
        <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',sans-serif;border:1px solid #ddd;padding:20px;border-radius:8px;">
          <div style="text-align:center;margin-bottom:20px;">
            <img src="https://firebasestorage.googleapis.com/v0/b/talent-platform-c6b73.firebasestorage.app/o/Websites%2FFlux_Dev_A_modern_creative_logo_for_a_website_featuring_the_na_0.png?alt=media&token=8c88c807-c39f-4dc3-b34a-04da8a2c86f6" alt="FluxDev Logo" style="height:100px;">
          </div>
          <p>Hello ${freelancerName},</p>
          <p>You've received a job offer. Please find the attached offer letter PDF for details.</p>
          <p>We look forward to working with you.</p>
          <br>
          <p style="margin-top:30px;">Thanks & Regards,<br><strong>Talent Hub</strong></p>
        </div>
      `,
      attachments: [
        {
          filename: `OfferLetter-${freelancerName}.pdf`,
          path: outputPath,
          contentType: 'application/pdf'
        }
      ]
    });

    // 5. Only now — Save to DB
    const newOffer = new OfferLetter({
      jobPostId,
      freelancerId,
      clientId,
      offerMessage,
      offeredSalary,
      joiningDate
    });

    await newOffer.save();

    // 6. Populate and return response
    const populatedOffer = await OfferLetter.findById(newOffer._id)
      .populate("freelancerId", "email phoneNumber")
      .populate("jobPostId");

    res.status(201).json({ message: "Offer letter sent and saved successfully", offer: populatedOffer });

  } catch (error) {
    console.error('❌ Offer Send Error:', error);
    res.status(500).json({ message: "Failed to send offer or save", error: error.message });
  }
};




exports.getFreelancerOffers = async (req, res) => {
  try {
    const freelancerId = req.freelancerId;
    const statusFilter = req.query.status;

    const query = { freelancerId };
    if (statusFilter) query.status = statusFilter;

    const offers = await OfferLetter.find(query)
      .populate("jobPostId", "jobId jobTitle jobType jobCategory")
      .populate("clientId", "_id");

    if (!offers.length) {
      return res.status(404).json({ message: "No offers found." });
    }

    // Collect clientIds
    const clientIds = [...new Set(offers.map(o => o.clientId?._id.toString()))];

    // Fetch client profiles
    const profiles = await ClientProfile.find({ clientId: { $in: clientIds } });

    // Map clientId -> profile
    const profileMap = {};
    profiles.forEach(profile => {
      profileMap[profile.clientId.toString()] = profile;
    });

    // Fetch companies
    const companyNames = [...new Set(profiles.map(p => p.profileDetails.companyName))];
    const companies = await Company.find({ "companyDetails.companyName": { $in: companyNames } });

    const companyMap = {};
    companies.forEach(company => {
      companyMap[company.companyDetails.companyName] = company.companyDetails;
    });

    // Final flattened response
    const formattedOffers = offers.map(offer => {
      const profile = profileMap[offer.clientId?._id?.toString()];
      const company = profile ? companyMap[profile.profileDetails.companyName] : null;

      return {
        offerId: offer._id,
        status: offer.status,
        createdAt: offer.createdAt,
        jobId: offer.jobPostId?.jobId || null,
        jobTitle: offer.jobPostId?.jobTitle || null,
        jobType: offer.jobPostId?.jobType || null,
        jobCategory: offer.jobPostId?.jobCategory || null,
        companyId: company?.companyId || null,
        companyName: company?.companyName || null,
        companyAddress: company?.companyAddress || null,
        companyLogo: company?.companyLogo || null
      };
    });

    res.status(200).json(formattedOffers);
  } catch (error) {
    res.status(500).json({ message: "Failed to get offers", error: error.message });
  }
};




exports.respondToOffer = async (req, res) => {
  try {
    const freelancerId = req.freelancerId; // from auth
    const { offerId, response } = req.body;

    if (!["Accepted", "Rejected"].includes(response)) {
      return res.status(400).json({ message: "Invalid response value" });
    }

    const offer = await OfferLetter.findOne({ _id: offerId, freelancerId });

    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    if (offer.status !== "Pending") {
      return res.status(400).json({ message: "Offer already responded to" });
    }

    offer.status = response;
    offer.respondedOn = new Date();
    await offer.save();

    res.status(200).json({ message: `Offer ${response.toLowerCase()} successfully`, offer });
  } catch (error) {
    res.status(500).json({ message: "Failed to respond to offer", error: error.message });
  }
};




exports.getClientOffers = async (req, res) => {
  try {
    const clientId = req.clientId;

    // Step 1: Populate job and freelancer (basic)
    const offers = await OfferLetter.find({ clientId })
      .populate("freelancerId", "email phoneNumber") // populates base Freelancer
      .populate("jobPostId");

    // Step 2: Map and manually fetch freelancer profile
    const freelancerIds = offers.map(o => o.freelancerId?._id).filter(Boolean);
    const profiles = await FreelancerProfile.find({
      freelancerId: { $in: freelancerIds }
    });

    const profileMap = {};
    profiles.forEach(profile => {
      profileMap[profile.freelancerId.toString()] = profile.profileDetails;
    });

    // Step 3: Combine all data
    const result = offers.map(offer => {
      const job = offer.jobPostId;
      const freelancer = offer.freelancerId;
      const profile = profileMap[freelancer?._id?.toString()] || {};

      return {
        offerId: offer._id,
        fullName: profile?.fullName,
        email: profile?.email || freelancer?.email,
        phoneNumber: profile?.phoneNumber || freelancer?.phoneNumber,
        gender: profile?.gender,
        dob: profile?.dob,
        profilePicture: profile?.profilePicture?.url,
        jobId: job?.jobId,
        jobTitle: job?.jobTitle,
        companyName: job?.companyName,
        companyLocation: job?.companyLocation,
        offeredSalary: offer.offeredSalary,
        joiningDate: offer.joiningDate,
        status: offer.status,
        sentOn: offer.sentOn,
        respondedOn: offer.respondedOn,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get client offers",
      error: error.message,
    });
  }
};



