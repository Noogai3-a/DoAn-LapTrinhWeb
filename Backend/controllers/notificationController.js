const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

// Lấy danh sách thông báo của user
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.session.user?.id || req.session.admin?.id;
        
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const notifications = await Notification.find({ 
            userId: userId
        })
        .sort({ createdAt: -1 })  // Sắp xếp mới nhất lên đầu
        .limit(100);  // Giới hạn 100 thông báo

        res.json(notifications);
    } catch (error) {
        console.error('Lỗi khi lấy thông báo:', error);
        res.status(500).json({ message: 'Lỗi khi lấy thông báo' });
    }
};

// Đánh dấu đã đọc một thông báo
exports.markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true }
        );
        res.json({ message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái' });
    }
};

// Đánh dấu tất cả đã đọc
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, isRead: false },
            { isRead: true }
        );
        res.json({ message: 'Đã đánh dấu tất cả đã đọc' });
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái:', error);
        res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái' });
    }
};

// Tạo thông báo mới (dùng cho các controller khác)
exports.createNotification = async (userId, type, content, postTitle, postType) => {
    try {
        const notification = new Notification({
            userId,
            type,
            content,
            postTitle,
            postType,
            isRead: false
        });
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Lỗi khi tạo thông báo:', error);
        throw error;
    }
};

// Xóa thông báo
exports.deleteNotification = async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa thông báo' });
    } catch (error) {
        console.error('Lỗi khi xóa thông báo:', error);
        res.status(500).json({ message: 'Lỗi khi xóa thông báo' });
    }
};

// Lấy số lượng thông báo chưa đọc
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.user._id,
            isRead: false
        });
        res.json({ count });
    } catch (error) {
        console.error('Lỗi khi đếm thông báo:', error);
        res.status(500).json({ message: 'Lỗi khi đếm thông báo' });
    }
};