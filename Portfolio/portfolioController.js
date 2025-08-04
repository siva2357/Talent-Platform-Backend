const mongoose = require('mongoose');
const Portfolio = require('./portfolioModel');

// ✅ CREATE Portfolio
exports.createPortfolio = async (req, res) => {
  try {
    const { projectDetails } = req.body;

    if (!projectDetails) {
      return res.status(400).json({ message: "Portfolio details are required" });
    }

    const freelancerId = req.freelancerId; // ✅ Internal usage only

    projectDetails.softwares = Array.isArray(projectDetails.softwares) ? projectDetails.softwares : [projectDetails.softwares];
    projectDetails.tags = Array.isArray(projectDetails.tags) ? projectDetails.tags : [projectDetails.tags];

    const newProject = new Portfolio({
      freelancerId,
      projectDetails
    });

    await newProject.save();
    res.status(201).json({ message: "Portfolio created successfully", project: newProject });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ UPDATE Portfolio
exports.updatePortfolio = async (req, res) => {
  try {
    const { projectId } = req.params;
    const freelancerId = req.freelancerId;

    const existingProject = await Portfolio.findOne({ _id: projectId, freelancerId });
    if (!existingProject) {
      return res.status(404).json({ message: "Project not found for this freelancer" });
    }

    const updatedPortfolioDetails = {
      ...existingProject.projectDetails,
      ...req.body.projectDetails,
    };

    updatedPortfolioDetails.softwares = Array.isArray(updatedPortfolioDetails.softwares)
      ? updatedPortfolioDetails.softwares
      : [updatedPortfolioDetails.softwares];

    updatedPortfolioDetails.tags = Array.isArray(updatedPortfolioDetails.tags)
      ? updatedPortfolioDetails.tags
      : [updatedPortfolioDetails.tags];

    const updatedPortfolio = await Portfolio.findByIdAndUpdate(
      projectId,
      { $set: { projectDetails: updatedPortfolioDetails } }, // ✅ fixed here
      { new: true }
    );

    res.status(200).json({ message: "Portfolio updated successfully", project: updatedPortfolio });

  } catch (error) {
    res.status(500).json({ message: "Error updating project", error: error.message });
  }
};



// ✅ DELETE Portfolio
exports.deletePortfolio = async (req, res) => {
  try {
    const { projectId } = req.params;
    const freelancerId = req.freelancerId;

    const existingProject = await Portfolio.findOne({ _id: projectId, freelancerId });
    if (!existingProject) {
      return res.status(404).json({ message: "Project not found or unauthorized" });
    }

    await Portfolio.findByIdAndDelete(projectId);
    res.status(200).json({ message: "Project deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Error deleting project", error: error.message });
  }
};


// ✅ GET All Portfolios for logged-in freelancer
exports.getPortfolios = async (req, res) => {
  try {
    const freelancerId = req.freelancerId;

    const projects = await Portfolio.find(
      { freelancerId },
      { "projectDetails": 1, _id: 1 }
    );

    res.status(200).json({
      totalPortfolio: projects.length,
      projects
    });

  } catch (error) {
    res.status(500).json({ message: "Error fetching portfolios", error: error.message });
  }
};



// ✅ controller
exports.getPortfolioById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const freelancerId = req.freelancerId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid Project ID format' });
    }

    const project = await Portfolio.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.freelancerId.toString() !== freelancerId.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error('Error in getPortfolioById:', error);
    res.status(500).json({ message: 'Error fetching project', error: error.message });
  }
};



