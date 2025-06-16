const express = require('express');
const router = express.Router();
const multer = require('multer'); // 👈 THÊM DÒNG NÀY
const upload = require('../middleware/upload');

const blogAdminController = require('../controllers/blogAdminController');
const requireAdmin = require('../middleware/requireAdmin');
const documentController = require('../controllers/documentController');
const adminController = require('../controllers/adminController');

router.get('/stats', requireAdmin, blogAdminController.getAdminStats);
router.get('/blogs', requireAdmin, blogAdminController.getAllItemsForAdmin);
router.get('/pending-blogs', requireAdmin, blogAdminController.getPendingBlogs);

router.put('/approve-blog/:id', requireAdmin, blogAdminController.approveBlog);
router.put('/approve-document/:id', documentController.approveDocument);

router.delete('/reject-blog/:id', requireAdmin, blogAdminController.rejectBlog);

// ✅ Route upload nhiều file
router.post(
  '/upload-multiple',
  requireAdmin,
  upload.array('files', 10), // cho phép tối đa 10 file
  adminController.uploadMultipleDocuments
);

// ✅ Middleware xử lý lỗi multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('[Multer Error]', err);
    return res.status(400).json({ message: 'Lỗi upload (Multer): ' + err.message });
  } else if (err) {
    console.error('[Upload Error]', err);
    return res.status(400).json({ message: err.message || 'Lỗi upload không xác định' });
  }
  next();
});

module.exports = router;
