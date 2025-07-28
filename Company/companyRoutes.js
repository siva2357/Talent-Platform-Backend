const express = require('express');
const router = express.Router();
const companyController = require('./companyController');
const { identifier } = require('../Middleware/identification');
const upload = require('../Middleware/uploadCSV');

// Routes
router.post('/admin/company', identifier, companyController.createCompany);
router.post('/admin/company/upload', identifier, upload.single('file'), companyController.uploadCompanyCSV);
router.put('/admin/company/:id', identifier, companyController.updateCompany);
router.delete('/admin/company/:id', identifier, companyController.deleteCompany);
router.get('/admin/companies', identifier, companyController.getCompanies);
router.get('/admin/company/:id', identifier, companyController.getCompanyById);

module.exports = router;
