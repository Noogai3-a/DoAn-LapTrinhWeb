// routes/uploadDocumentRoutes.js

const express = require('express');
const router = express.Router();

const upload = require('../middleware/upload');
const uploadController = require('../controllers/uploadDocumentController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

// [POST] /api/documents/upload
router.post(
  '/upload',
  upload.array('files', 10),         
  uploadController.uploadDocument
);

module.exports = router;
