const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const apiAuth = require('../middleware/apiAuthMiddleware');

// Các route phổ biến
router.get('/latest', documentController.getLatestDocuments);
router.get('/popular', documentController.getPopularDocuments);
router.get('/by-subject/:subjectTypeSlug/:subjectNameSlug', documentController.getDocumentsBySubject);

// Lấy tài liệu do user hiện tại đăng
router.get('/my', apiAuth, documentController.getMyDocuments);

// Route lấy chi tiết theo ID — đặt cuối cùng
// router.get('/:id', documentController.getDocumentById);

module.exports = router;
