const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const Otp = require('../models/Otp');
const User = require('../models/User');

//Đăng ký
exports.register = async(req, res) => {
    const {username, email, password} = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) 
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
        const user = await User.findOne({ email });
        if (!user) 
            return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ msg: 'Invalid credentials' });

        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email
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
        res.status(500).json({ msg: 'Server error' });
    }
}

//Đăng xuất
exports.logout = (req, res) => {
    console.log("toi da o day");
    req.session.destroy((err) => {
        if (err) 
            return res.status(500).json({ msg: 'Logout failed' });
        res.clearCookie('connect.sid');
        res.redirect('http://localhost:5000/');
    })
}

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
