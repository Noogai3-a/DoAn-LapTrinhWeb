const Blog = require('../models/Blog');
const BlogContent = require('../models/BlogContent');
const User = require('../models/User');
const Document = require('../models/Document');
const notificationController = require('./notificationController');
const Comment = require('../models/Comment');

// Lấy danh sách bài blog chưa được duyệt
exports.getPendingBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ approved: false }).lean();
    
    const blogIds = blogs.map(blog => blog._id);
    const contents = await BlogContent.find({ blog: { $in: blogIds } }).lean();

    const contentMap = {};
    contents.forEach(c => {
      contentMap[c.blog.toString()] = c.content;
    });

    const result = blogs.map(blog => ({
      ...blog,
      content: contentMap[blog._id.toString()] || ''
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Lỗi khi lấy danh sách bài chưa duyệt' });
  }
};

// Duyệt bài blog (approve)
exports.approveBlog = async (req, res) => {
  try {
    const blogId = req.params.id;

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ msg: 'Blog không tồn tại' });

    if (blog.approved) return res.status(400).json({ msg: 'Blog đã được duyệt trước đó' });

    blog.approved = true;
    await blog.save();

    await notificationController.createNotification(
      blog.authorId,
      'APPROVE',
      {
        message: `Bài viết "${blog.title}" đã được duyệt`,
        postId: blog._id
      },
      blog.title,
      'BLOG'
    );

    res.json({ msg: 'Duyệt bài thành công', blog });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Lỗi khi duyệt bài' });
  }
};

exports.rejectBlog = async (req, res) => {
  try {
    const blogId = req.params.id;

    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ msg: 'Blog không tồn tại' });

    // Thêm thông báo cho tác giả trước khi xóa
    await notificationController.createNotification(
      blog.authorId,
      'REJECT',
      {
        message: `Bài viết "${blog.title}" không đạt tiêu chuẩn`,
        postId: blog._id
      },
      blog.title,
      'BLOG'
    );

    // Xóa blog và các nội dung liên quan
    await BlogContent.deleteOne({ blog: blog._id });
    await Blog.deleteOne({ _id: blog._id });

    res.json({ msg: 'Từ chối bài thành công' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Lỗi khi từ chối bài' });
  }
};
// Ví dụ trong blogAdminController.js
exports.getBlogsForAdmin = async (req, res) => {
  try {
    const approvedBlogs = await Blog.find({ approved: true }).sort({ createdAt: -1 });
    const pendingBlogs = await Blog.find({ approved: false }).sort({ createdAt: -1 });

    res.json({ approvedBlogs, pendingBlogs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Lỗi khi lấy dữ liệu blog' });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    const totalBlog = await Blog.countDocuments(); // tổng Blog
    const totalDocuments = await Document.countDocuments(); // tổng tài liệu
    const totalUsers = await User.countDocuments(); // tổng user đăng ký
    const pendingBlogs = await Blog.countDocuments({ approved: false }); // blog chưa duyệt
    const pendingDocuments = await Document.countDocuments({ status: { $in: ['pending', 'rejected'] } }); 

    const total = totalBlog + totalDocuments;
    const pending = pendingBlogs + pendingDocuments;

    res.json({
      total,
      totalUsers,
      pending
    });
  } catch (err) {
    console.error('Error getting stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getAllItemsForAdmin = async (req, res) => {
  try {
    // Blog
    const approvedBlogs = await Blog.find({ approved: true }).sort({ createdAt: -1 }).lean();
    const pendingBlogs = await Blog.find({ approved: false }).sort({ createdAt: -1 }).lean();

    const mapBlog = blog => ({
      ...blog,
      type: 'blog',
      approved: blog.approved,
      author: blog.author,
      subject: 'Blog', // để frontend hiển thị
      createdAt: blog.createdAt
    });

    // Document
    const approvedDocuments = await Document.find({ status: 'approved' }).sort({ uploadDate: -1 }).lean();
    const pendingDocuments = await Document.find({ status: { $in: ['pending', 'rejected'] } }).sort({ uploadDate: -1 }).lean();

    const mapDoc = doc => ({
      ...doc,
      type: 'document',
      approved: doc.status === 'approved',
      author: doc.uploader,
      subject: doc.subjectNameLabel,
      createdAt: doc.uploadDate
    });

    res.json({
      approvedItems: [...approvedBlogs.map(mapBlog), ...approvedDocuments.map(mapDoc)],
      pendingItems: [...pendingBlogs.map(mapBlog), ...pendingDocuments.map(mapDoc)],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Lỗi khi lấy dữ liệu admin' });
  }
};
