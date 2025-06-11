const express = require('express');
const router = express.Router();
const blogAdminController = require('../controllers/blogAdminController');
const requireAdmin = require('../middleware/requireAdmin');
const documentController = require('../controllers/documentController');

router.get('/stats', requireAdmin, blogAdminController.getAdminStats);

router.get('/blogs', requireAdmin, blogAdminController.getAllItemsForAdmin);

// Route lấy danh sách bài chưa duyệt
router.get('/pending-blogs', requireAdmin, blogAdminController.getPendingBlogs);

// Route duyệt bài (approve)
router.put('/approve-blog/:id', requireAdmin, blogAdminController.approveBlog);

router.put('/approve-document/:id', documentController.approveDocument);


module.exports = router;
