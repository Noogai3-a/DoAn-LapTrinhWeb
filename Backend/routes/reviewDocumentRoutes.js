const express = require('express');
const router = express.Router();
const documentController = require('../controllers/reviewDocumentController');

//Route đặc biệt trước
router.get('/by-slug/:slug', documentController.getDocumentBySlug);

//Các route khác
router.get('/', documentController.getDocumentsForAdmin);
router.put('/approve/:id', documentController.approveDocument);
router.delete('/:id', documentController.rejectDocument);
router.delete('/:id', documentController.deleteDocument);

//Cuối cùng: bắt theo ID
router.get('/:id', documentController.getDocumentById);


module.exports = router;
