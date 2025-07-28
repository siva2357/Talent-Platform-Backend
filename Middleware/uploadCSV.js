// middlewares/uploadCSV.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    cb(null, 'company_' + Date.now() + path.extname(file.originalname));
  }
});

const csvFilter = function (req, file, cb) {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb('Please upload only CSV files.', false);
  }
};

const upload = multer({ storage: storage, fileFilter: csvFilter });
module.exports = upload;
