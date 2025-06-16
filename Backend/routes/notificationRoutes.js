const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// Lấy danh sách thông báo
router.get('/', authMiddleware, notificationController.getNotifications);
// Đánh dấu đã đọc một thông báo
router.put('/:id/read', authMiddleware, notificationController.markAsRead);
// Đánh dấu tất cả đã đọc
router.put('/read-all', authMiddleware, notificationController.markAllAsRead);

module.exports = router;