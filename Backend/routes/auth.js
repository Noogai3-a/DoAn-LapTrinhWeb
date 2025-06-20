const express = require('express');
const router = express.Router();
const authController =  require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const path = require('path');

//Đăng ký
router.post('/register', authController.register);

//Đăng nhập
router.post('/login', authController.login);

//Đăng xuất
router.get('/logout', authController.logout);

//Gửi otp
router.post('/send-otp', authController.sendOtp);

//Kiểm tra otp
router.post('/verify-otp', authController.verifyOtp);

//Kiểm tra trạng thái đăng nhập
router.post('/get-session', authController.getSession);

// Route bảo vệ - chỉ cho user đã đăng nhập
router.get('/dashboard', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '../Public/index.html'));
});

// Trả thông tin người dùng

router.post('/reset-password', authController.resetPassword);


module.exports = router;