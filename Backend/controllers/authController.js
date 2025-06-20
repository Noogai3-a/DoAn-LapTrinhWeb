const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const Otp = require('../models/Otp');
const User = require('../models/User');
const Admin = require('../models/Admin')

//Đăng ký
exports.register = async(req, res) => {
    const {username, email, password} = req.body;
    try {
        const existingUser = await User.findOne({ email });
        const existingAdmin = await Admin.findOne({ email });
        if (existingUser || existingAdmin) 
            return res.status(400).json({ msg: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        
        res.status(201).json({ msg: 'Registered successfully' });
    } catch (err) {
        res.status(500).json({msg: 'Server error'});
    }
}

//Đăng nhập
exports.login = async(req, res) => {
    const {email, password} = req.body;
    try {
        const admin = await Admin.findOne({email});
        if (admin)
        {
            const isMatch = await bcrypt.compare(password, admin.password);
            if (!isMatch)
            {
                return res.status(400).json({ msg: 'Invalid credentials' });
            }

            req.session.admin = {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: 'admin'
            }

            return res.json({
                msg: 'Login successful',
                user: {
                    id: admin._id,
                    username: admin.username,
                    email: admin.email
                }
            })
        }

        const user = await User.findOne({ email });
        if (!user) 
            return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ msg: 'Invalid credentials' });

        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            role: 'user'
        }

        console.log('Đã tạo session:', req.session);

        return res.json({ 
            msg: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
}

//Đăng xuất
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ msg: 'Logout failed' });
        }

        res.clearCookie('sid', {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });

        res.status(200).json({ msg: 'Logged out successfully' });
    });
};


//Gửi Otp
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,     // email của bạn
        pass: process.env.EMAIL_PASS      // mật khẩu hoặc app password
    }
});

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


exports.sendOtp = async(req, res) => {
    const {email} = req.body;

    if (!email) 
        return res.status(400).json({ msg: 'Email là bắt buộc' });

    try {
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 phút

        await Otp.findOneAndUpdate(
            { email },
            { otp, expiresAt },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Mã OTP đăng ký tài khoản WeShare',
            text: `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`
        };

        await transporter.sendMail(mailOptions);
        return res.json({ msg: 'Đã gửi OTP về email' });
    } catch (error) {
        console.error('Lỗi gửi OTP:', error);
        return res.status(500).json({ msg: 'Gửi email thất bại' });
    }
};


//Xác thực Otp
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ msg: 'Thiếu email hoặc OTP' });
    }

    try {
        const record = await Otp.findOne({ email, otp });
        if (!record) {
            return res.status(400).json({ msg: 'OTP không đúng' });
        }

        if (record.expiresAt < new Date()) {
            await Otp.deleteOne({ _id: record._id });
            return res.status(400).json({ msg: 'OTP đã hết hạn' });
        }

        await Otp.deleteOne({ _id: record._id });
        return res.status(200).json({ msg: 'OTP hợp lệ' });

    } catch (err) {
        console.error('Lỗi verifyOtp:', err);
        return res.status(500).json({ msg: 'Lỗi server' });
    }
};

//Kiểm tra trạng thái đăng nhập
exports.getSession = async(req, res) => {
    if (req.session.user) {
        return res.json({ loggedIn: true, user: req.session.user });
    } else {
        return res.json({ loggedIn: false });
    }
}

exports.resetPassword = async (req, res) => {
    try {
        // 1. Lấy email và mật khẩu mới từ request body
        const { email, newPassword } = req.body;

        // 2. Kiểm tra dữ liệu đầu vào
        if (!email || !newPassword) {
            return res.status(400).json({ msg: 'Vui lòng cung cấp email và mật khẩu mới.' });
        }

        // 3. Tìm người dùng trong database bằng email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'Không tìm thấy người dùng với email này.' });
        }

        // 4. Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 5. Cập nhật mật khẩu mới cho người dùng
        user.password = hashedPassword;
        await user.save();

        // 6. Gửi phản hồi thành công
        res.status(200).json({ msg: 'Đặt lại mật khẩu thành công!' });

    } catch (error) {
        console.error('Lỗi khi đặt lại mật khẩu:', error);
        res.status(500).json({ msg: 'Lỗi máy chủ.' });
    }
};
