const Contract = require("./contractModel");
const mongoose = require("mongoose");
const Client = require('../Authentication/clientModel');

// CREATE a new contract
exports.createContract = async (req, res) => {
  try {
    const clientId = req.clientId;
    if (!clientId) return res.status(403).json({ success: false, message: "Unauthorized. Client ID missing." });

    const newContract = new Contract({ ...req.body, clientId });
    await newContract.save();
    res.status(201).json({ success: true, message: "Contract created successfully", contract: newContract });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET all contracts
exports.getAllContracts = async (req, res) => {
  try {
    const contracts = await Contract.find()
      .populate("clientId", "registrationDetails.fullName registrationDetails.email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, contracts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching contracts", error: error.message });
  }
};

// GET contract by ID
exports.getContractById = async (req, res) => {
  try {
    const contractId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(contractId)) {
      return res.status(400).json({ success: false, message: "Invalid contract ID" });
    }

    const contract = await Contract.findById(contractId)
      .populate("clientId", "registrationDetails.fullName registrationDetails.email");

    if (!contract) {
      return res.status(404).json({ success: false, message: "Contract not found" });
    }

    res.status(200).json({ success: true, contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE contract by ID
exports.updateContractById = async (req, res) => {
  try {
    const clientId = req.clientId;

    const updatedContract = await Contract.findOneAndUpdate(
      { _id: req.params.id, clientId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedContract) {
      return res.status(404).json({ success: false, message: "Contract not found or unauthorized" });
    }

    res.status(200).json({ success: true, message: "Contract updated successfully", contract: updatedContract });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


// DELETE contract by ID
exports.deleteContractById = async (req, res) => {
  try {
    const clientId = req.clientId;

    const deleted = await Contract.findOneAndDelete({ _id: req.params.id, clientId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Contract not found or unauthorized" });
    }

    res.status(200).json({ success: true, message: "Contract deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



exports.getContractsForAdmin = async (req, res) => {
  try {
    if (!req.adminId) return res.status(403).json({ success: false, message: "Unauthorized: Admin access only" });

    const contracts = await Contract.find({ status: "Pending" })
      .populate("clientId", "registrationDetails.fullName registrationDetails.email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, contracts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching pending contracts", error: error.message });
  }
};



exports.approveContractByAdmin = async (req, res) => {
  try {
    if (!req.adminId) return res.status(403).json({ success: false, message: "Unauthorized: Admin access only" });

    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      {
        status: "Open",
        verifiedByAdmin: true,
        adminReviewedOn: new Date(),
        reviewedBy: req.adminId
      },
      { new: true }
    );

    if (!contract) return res.status(404).json({ success: false, message: "Contract not found" });

    res.status(200).json({ success: true, message: "Contract approved", contract });
  } catch (error) {
    res.status(500).json({ success: false, message: "Approval failed", error: error.message });
  }
};


exports.rejectContractByAdmin = async (req, res) => {
  try {
    if (!req.adminId) return res.status(403).json({ success: false, message: "Unauthorized: Admin access only" });

    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      {
        status: "Rejected",
        verifiedByAdmin: false,
        adminReviewedOn: new Date(),
        reviewedBy: req.adminId
      },
      { new: true }
    );

    if (!contract) return res.status(404).json({ success: false, message: "Contract not found" });

    res.status(200).json({ success: true, message: "Contract rejected", contract });
  } catch (error) {
    res.status(500).json({ success: false, message: "Rejection failed", error: error.message });
  }
};






// 1. Get all OPEN contracts for freelancer to view/apply
exports.getOpenContractsForFreelancer = async (req, res) => {
  try {
    const openContracts = await Contract.find({ status: "open" }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, contracts: openContracts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get single contract by ID (freelancer view)
exports.getContractByIdForFreelancer = async (req, res) => {
  try {
    const contract = await Contract.findOne({ _id: req.params.id, status: "open" });
    if (!contract) {
      return res.status(404).json({ success: false, message: "Contract not found or not open" });
    }
    res.status(200).json({ success: true, contract });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Apply to a contract
exports.applyToContract = async (req, res) => {
  try {
    const freelancerId = req.freelancerId;

    const contract = await Contract.findById(req.params.id);
    if (!contract || contract.status !== "Open") {
      return res.status(400).json({ success: false, message: "Contract not found or not open" });
    }

    // Check if already applied
    const alreadyApplied = contract.applicants.some(app => app.freelancerId.toString() === freelancerId);
    if (alreadyApplied) {
      return res.status(409).json({ success: false, message: "Already applied" });
    }

    contract.applicants.push({ freelancerId });
    contract.totalApplicants = contract.applicants.length;
    await contract.save();

    res.status(200).json({ success: true, message: "Applied to contract successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// 4. Withdraw application
exports.withdrawFromContract = async (req, res) => {
  try {
    const freelancerId = req.freelancerId;

    const contract = await Contract.findById(req.params.id);
    const index = contract.applicants.findIndex(app => app.freelancerId.toString() === freelancerId);
    if (index === -1) {
      return res.status(404).json({ success: false, message: "Not applied to this contract" });
    }

    contract.applicants.splice(index, 1);
    contract.totalApplicants = contract.applicants.length;
    await contract.save();

    res.status(200).json({ success: true, message: "Withdrawn from contract successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



