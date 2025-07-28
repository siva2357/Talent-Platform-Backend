const Company = require('./companyModel');
const csv = require('csv-parser');
const fs = require('fs');

// Create single company
exports.createCompany = async (req, res) => {
  try {
    const { companyDetails } = req.body;
    if (!companyDetails) return res.status(400).json({ message: "Company details are required" });
    if (!req.adminId) return res.status(401).json({ message: "Unauthorized: Admin ID is missing" });

    const newCompany = new Company({ adminId: req.adminId, companyDetails });
    await newCompany.save();

    res.status(201).json({ message: "Company created successfully", company: newCompany });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload companies via CSV
exports.uploadCompanyCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'CSV file is required' });
    if (!req.adminId) return res.status(401).json({ message: "Unauthorized: Admin ID is missing" });

    const companies = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        companies.push({
          adminId: req.adminId,
          totalCount: Number(row.totalCount),
          companyDetails: {
            companyId: row.companyId,
            companyLogo: {
              fileName: row.companyLogo_fileName,
              url: row.companyLogo_url
            },
            companyName: row.companyName,
            companyAddress: row.companyAddress
          }
        });
      })
      .on('end', async () => {
        await Company.insertMany(companies);
        fs.unlinkSync(req.file.path); // delete uploaded file
        res.status(200).json({ message: 'Companies uploaded successfully', total: companies.length });
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update company
exports.updateCompany = async (req, res) => {
  try {
    const updatedCompany = await Company.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updatedCompany);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete company
exports.deleteCompany = async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Company deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all companies for the admin
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ adminId: req.adminId });
    const totalCount = await Company.countDocuments({ adminId: req.adminId });

    res.status(200).json({ totalCompanies: totalCount, companies });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single company by ID
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
