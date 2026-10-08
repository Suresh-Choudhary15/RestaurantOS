const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate, requirePermission } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const aiController = require('../controllers/ai.controller');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Only image formats supported by Tesseract.js (PNG, JPEG, JPG, WEBP)
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported formats: PNG, JPEG, JPG, WEBP'));
    }
  },
});

router.use(authenticate);

router.post(
  '/process-invoice',
  requirePermission('create', 'expenses'),
  upload.single('file'),
  audit('supplier_invoices', { action: 'CREATE' }),
  aiController.processInvoice
);

module.exports = router;
