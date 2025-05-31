const express = require('express');
const router = express.Router();
const multer = require('multer');

const blogController = require('../controllers/blogController');
const authMiddleware = require('../middleware/authMiddleware');

// Cấu hình multer để lưu trong bộ nhớ (có thể đổi sang diskStorage nếu muốn lưu file ra ổ cứng)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Lấy tất cả blog
router.get('/', blogController.getAllBlogs);

router.get('/my', authMiddleware, blogController.getMyBlogs);

router.get('/top/viewed', blogController.getMostViewedBlogs); 

// Lấy blog theo ID
router.get('/:id', blogController.getBlogById);

// Tạo blog mới (dùng upload.single để xử lý ảnh thumbnail)
router.post('/', authMiddleware, upload.single('thumbnailImage'), blogController.createBlog);

// Cập nhật blog
router.put('/:id', authMiddleware, blogController.updateBlog);

// Xoá blog
router.delete('/:id', authMiddleware, blogController.deleteBlog);

router.post('/:blogId/comments', authMiddleware, blogController.createComment);

module.exports = router;
