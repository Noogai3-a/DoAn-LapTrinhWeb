const express = require('express');
const router = express.Router();
const documentController = require('../controllers/reviewDocumentController');

// 📌 ĐẶT route đặc biệt TRƯỚC:
router.get('/', documentController.getDocumentsForAdmin);
router.put('/approve/:id', documentController.approveDocument);
router.delete('/:id', documentController.rejectDocument);

// ❗ CUỐI CÙNG: route bắt toàn bộ :id
router.get('/:id', documentController.getDocumentById);

module.exports = router;
