const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const apiAuth = require('../middleware/apiAuthMiddleware');
const authMiddleware = require('../middleware/authMiddleware');

// Các route phổ biến
router.get('/latest', documentController.getLatestDocuments);
router.get('/popular', documentController.getPopularDocuments);
router.get('/by-subject/:subjectTypeSlug/:subjectNameSlug', documentController.getDocumentsBySubject);
// routes/reviewDocumentRoutes.js
router.put('/:id',  documentController.updateDocument);
router.get('/search', documentController.searchDocuments);
// Lấy tài liệu do user hiện tại đăng
router.get('/my', apiAuth, documentController.getMyDocuments);

// Route lấy chi tiết theo ID — đặt cuối cùng
router.get('/:id', documentController.getDocumentById);

router.post('/:documentId/comments', authMiddleware, documentController.createDocumentComment);

module.exports = router;
