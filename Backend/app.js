const fs = require('fs');
const path = require('path');
require('dotenv').config();

if (process.env.GOOGLE_CREDENTIALS) {
  const decoded = Buffer.from(process.env.GOOGLE_CREDENTIALS, 'base64').toString('utf8');
  const outputPath = path.join(__dirname, 'credentials.json');

  if (!fs.existsSync(outputPath)) {
    fs.writeFileSync(outputPath, decoded);
    console.log('✅ credentials.json written successfully');
  }
}

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');

const app = express();

// CORS: Cho phép frontend truy cập với session
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:5000',
  'https://nhom11nt208p24.vercel.app/',
  'https://do-an-khaki.vercel.app/',
  'https://backend-yl09.onrender.com',
  /\.vercel\.app$/  // Regex để cho phép tất cả domain phụ từ vercel
];
app.set('trust proxy', 1); // Rất quan trọng khi dùng secure cookie trên Render

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json({ limit: '10mb' }));


app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));


// Session middleware
app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'default_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,          // ✅ phải true vì dùng HTTPS (Render)
    sameSite: 'none',      // ✅ bắt buộc để gửi cookie cross-origin (Vercel)
    maxAge: 1000 * 60 * 60 // 1 giờ
  },
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  })
}));

app.get('/api/debug-session', (req, res) => {
  res.json({
    session: req.session,
    cookies: req.cookies
  });
});
// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '../Frontend')));
app.use('/json', express.static(path.join(__dirname, 'json')));

//Imagines
const multer = require('multer');
const upload = multer({ dest: 'uploads/Img/' });  // folder tạm lưu file upload
const { uploadFileToDrive } = require('./uploads/googleDrive');

// Routes
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blogRoutes');
const adminRoutes = require('./routes/Admin');
const authMiddleware = require('./middleware/authMiddleware'); 
const requireAdmin = require('./middleware/requireAdmin');
const proxyRoutes = require('./routes/proxy');
const uploadRoutes = require('./routes/uploadDocumentRoutes');
const documentRoutes = require('./routes/reviewDocumentRoutes');
const reviewDocRoutes = require('./routes/documentRoutes');
const apiAuthMiddleware = require('./middleware/apiAuthMiddleware');
const documentController = require('./controllers/documentController');
const notificationRoutes = require('./routes/notificationRoutes');

app.get('/api/documents/my', apiAuthMiddleware, documentController.getMyDocuments);



app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Public/index.html'));
});


//Đăng nhập
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Public/login.html'));
});

//Đăng ký
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Public/signup.html'));
});

//Quản lý tài liệu/blog - user
app.get('/userql', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Public/userQL.html'));
});

//Quản lý tài khoản - user
app.get('/usertk', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Public/userTK.html'));
});

//Admin
app.get('/adminTQ', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Public/adminTQ.html'));
});

app.get('/adminTL', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Public/adminTL.html'));
});

app.get('/adminND', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Public/adminND.html'));
});

//Trang chủ blog
app.get('/blog', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Public/blog.html'));
});

//Đọc blog
app.get('/blog-read', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Public/blog-read.html'));
});

//Đăng blog
app.get('/blog-post', authMiddleware,(req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Public/blog-post.html'));
});

//Đăng tài liệu
app.use('/api/upload-documents', uploadRoutes);         // chứa: POST upload

//Duyệt tài liệu
app.use('/api/review-documents', documentRoutes);       // chứa: /:id, duyệt/xóa document

//Xem tài liệu 
app.use('/api/documents', reviewDocRoutes);             // chứa: /latest, /popular → frontend dùng
app.use('/uploads', express.static('uploads'));
app.get('/document.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/Public/document.html'));
});

//Tìm tài liệu
app.get('/document', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Public/standard.html'));
});

app.get('/upload', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Public/upload1.html'));
});


app.use('/api/blogs', blogRoutes);
app.use('/uploads/previews', express.static(path.join(__dirname, 'uploads/previews')));

// Route trả thông tin người dùng
app.get('/api/user-info', authMiddleware, (req, res) => {
    if (req.session.admin) {
        return res.json({ 
            _id: req.session.admin.id,
            role: 'admin',
            username: req.session.admin.username,
            email: req.session.admin.email
        });
    } else if (req.session.user) {
        return res.json({ 
            _id: req.session.user.id,
            role: 'user',
            username: req.session.user.username,
            email: req.session.user.email
        });
    } else {
        return res.status(401).json({ msg: 'Not logged in' });
    }
});
app.use('/api', proxyRoutes)
// Thêm route đổi mật khẩu
const bcrypt = require('bcryptjs');
app.post('/api/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới' });
        }

        // Kiểm tra xem là admin hay user thông thường
        const userModel = req.session.admin ? 
            require('./models/Admin') : 
            require('./models/User');
        
        const userId = req.session.admin ? 
            req.session.admin.id : 
            req.session.user.id;

        // Tìm user trong database
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'USER_NOT_FOUND' });
        }

        // Kiểm tra mật khẩu hiện tại
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'INCORRECT_CURRENT_PASSWORD' });
        }

        // Kiểm tra mật khẩu mới không giống mật khẩu cũ
        if (currentPassword === newPassword) {
            return res.status(400).json({ error: 'NEW_PASSWORD_MUST_BE_DIFFERENT' });
        }

        // Hash mật khẩu mới và lưu vào database
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // Trả về thành công
        res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        console.error('Lỗi khi đổi mật khẩu:', error);
        res.status(500).json({ error: 'SERVER_ERROR' });
    }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

