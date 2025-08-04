const express = require('express');
const router = express.Router();
const projectUploadController = require("./portfolioController");
const { identifier } = require('../Middleware/identification');

// ✅ All routes use identifier to inject freelancerId internally

router.post('/project', identifier, projectUploadController.createPortfolio);

router.put('/project/:projectId/update', identifier, projectUploadController.updatePortfolio);

router.delete('/project/:projectId/delete', identifier, projectUploadController.deletePortfolio);

router.get('/projects', identifier, projectUploadController.getPortfolios);

router.get('/project/:projectId', identifier, projectUploadController.getPortfolioById);


module.exports = router;