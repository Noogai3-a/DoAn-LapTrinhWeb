const express = require('express');
const router = express.Router();
const documentController = require('../controllers/reviewDocumentController');

//Route đặc biệt trước
router.get('/by-slug/:slug', documentController.getDocumentBySlug);

//Các route khác
router.get('/', documentController.getDocumentsForAdmin);
router.put('/approve/:id', documentController.approveDocument);
router.delete('/reject/:id', (req, res, next) => {
  console.log('HIT /reject/:id');
  next();
}, documentController.deleteDocumentById);

//Cuối cùng: bắt theo ID
router.get('/:id', documentController.getDocumentById);


module.exports = router;
