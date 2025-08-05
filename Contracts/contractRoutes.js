const express = require("express");
const router = express.Router();
const contractController = require("./contractController");
const { identifier } = require('../Middleware/identification');
// CREATE a new contract
router.post("/contract", identifier,contractController.createContract);

// GET all contracts
router.get("/contracts", identifier,contractController.getAllContracts);

// GET single contract by ID
router.get("/contract/:id", identifier,contractController.getContractById);

// UPDATE contract by ID
router.put("/contract/:id", identifier,contractController.updateContractById);

// DELETE contract by ID
router.delete("/contract/:id", identifier,contractController.deleteContractById);


router.get("/contracts/pending", identifier, contractController.getContractsForAdmin);
router.put("/contract/:id/approve", identifier, contractController.approveContractByAdmin);
router.put("/contract/:id/reject", identifier, contractController.rejectContractByAdmin);





router.get("/contracts/open", identifier, contractController.getOpenContractsForFreelancer);
router.get("/contract/:id", identifier, contractController.getContractByIdForFreelancer);
router.post("/contract/:id/apply", identifier, contractController.applyToContract);
router.post("/contract/:id/withdraw", identifier, contractController.withdrawFromContract);



module.exports = router;
