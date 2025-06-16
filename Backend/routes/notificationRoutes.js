const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');

// Tất cả routes đều yêu cầu đăng nhập
router.use(verifyToken);
// Lấy danh sách thông báo
router.get('/', notificationController.getNotifications);
// Đánh dấu đã đọc một thông báo
router.put('/:id/read', notificationController.markAsRead);
// Đánh dấu tất cả đã đọc
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;