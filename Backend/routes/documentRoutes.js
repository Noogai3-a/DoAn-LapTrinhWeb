const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');

// ✅ Route đặc biệt đặt trước
router.get('/latest', documentController.getLatestDocuments);
router.get('/popular', documentController.getPopularDocuments);
router.get(
  '/by-subject/:subjectTypeSlug/:subjectNameSlug',
  documentController.getDocumentsBySubject
);

// ❗ Nếu bạn có router.get('/:id', ...) thì đặt SAU CÙNG
// router.get('/:id', documentController.getDocumentById);

module.exports = router;
