const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { importCSV, importOCR } = require('../controllers/importController');
const { protect } = require('../middleware/auth');

// Ensure uploads folder exists in workspace
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

router.use(protect); // protect all upload routes

router.post('/csv', upload.single('file'), importCSV);
router.post('/ocr', upload.single('image'), importOCR);

module.exports = router;
