const Blog = require('../models/Blog');
const BlogContent = require('../models/BlogContent');
const Comment = require('../models/Comment');
const fs = require('fs');
const { uploadFileToDrive } = require('../uploads/googleDrive');
const { containsBadWords } = require('../utils/badWords');
const notificationController = require('./notificationController');

// --- Blog ---

exports.getAllBlogs = async (req, res) => {
  try {
    // Lọc chỉ lấy các blog đã được duyệt
    const blogs = await Blog.find({ approved: true }).lean();

    const blogIds = blogs.map(blog => blog._id);

    const contents = await BlogContent.find({ blog: { $in: blogIds } }).lean();

    const contentMap = {};
    contents.forEach(content => {
      contentMap[content.blog.toString()] = content.content;
    });

    const blogsWithContent = blogs.map(blog => ({
      ...blog,
      content: contentMap[blog._id.toString()] || ''
    }));

    res.json(blogsWithContent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Lỗi khi lấy danh sách blog' });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const { preview } = req.query;
    const isPreview = preview === 'true';
    const session = req.session;

    let blog;

    if (isPreview) {
      // Nếu là preview, chỉ cho admin xem
      if (!session || !session.admin) {
        return res.status(403).json({ msg: 'Unauthorized preview' });
      }
      blog = await Blog.findById(req.params.id); // không cần kiểm approved
    } else {
      // Nếu không phải preview thì chỉ lấy blog đã duyệt
      blog = await Blog.findOne({ _id: req.params.id, approved: true });
    }

    if (!blog) return res.status(404).json({ msg: 'Blog not found' });

    if (!isPreview) {
      blog.views += 1;
      await blog.save();
    }

    const blogContent = await BlogContent.findOne({ blog: blog._id });
    const comments = await Comment.find({ blog: blog._id }).sort({ createdAt: -1 }).lean();

    res.json({ 
      blog, 
      content: blogContent ? blogContent.content : '', 
      comments 
    });
  } catch (err) {
    console.error('getBlogById error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getMostViewedBlogs = async (req, res) => {
  try {
    // Lọc chỉ blog đã duyệt
    const blogs = await Blog.find({ approved: true }).sort({ views: -1 }).limit(5);
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.createBlog = async (req, res) => {
  try {
    const { title, content } = req.body;
    const author = req.session.user?.username ?? req.session.admin?.username;
    const authorId = req.session.user?.id ?? req.session.admin?.id;
    const path = require('path');
    const fs = require('fs');
    const { uploadFileToDrive } = require('../uploads/googleDrive');

    const folderId = '185Efbd-izYwsA4r41TXgVMu_rGoWDXf9';
    const siteUrl = process.env.SITE_URL || 'http://localhost:5500'; // Dùng để tạo link proxy

    if (!title || !content) {
      return res.status(400).json({ msg: 'Title and content are required' });
    }

    if (!req.file) {
      return res.status(400).json({ msg: 'Thumbnail image is required' });
    }

    // === Xử lý ảnh thumbnail ===
    const tempPath = path.join(__dirname, '..', 'uploads', 'Img', `${Date.now()}-${req.file.originalname}`);
    fs.writeFileSync(tempPath, req.file.buffer);
    const thumbnailImage = await uploadFileToDrive(tempPath, req.file.originalname, folderId);
    fs.unlinkSync(tempPath);

    // === Xử lý ảnh trong content ===
    async function uploadBase64Image(base64String, fileNamePrefix = 'img') {
      const matches = base64String.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!matches) return null;

      const mimeType = matches[1];
      const base64Data = matches[2];
      const extension = mimeType.split('/')[1];
      const fileName = `${fileNamePrefix}-${Date.now()}.${extension}`;
      const filePath = path.join(__dirname, '..', 'uploads', 'Img', fileName);

      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      const driveUrl = await uploadFileToDrive(filePath, fileName, folderId);
      fs.unlinkSync(filePath);

      return driveUrl;
    }

    let newContent = content;
    const imageUrls = [];
    const imgBase64Regex = /<img[^>]+src="(data:image\/[^">]+)"/g;
    const base64Images = [...content.matchAll(imgBase64Regex)];

    for (const match of base64Images) {
      const base64Image = match[1];
      const driveUrl = await uploadBase64Image(base64Image);
      if (driveUrl) {
        // GIỮ LẠI link Google Drive gốc
        newContent = newContent.replace(base64Image, driveUrl);
        imageUrls.push(driveUrl);
      }
    }

    // === Lưu blog ===
    const newBlog = new Blog({
      title,
      author,
      authorId,
      thumbnailImage,
      views: 0,
    });
    await newBlog.save();

    const newBlogContent = new BlogContent({
      blog: newBlog._id,
      content: newContent,
      imageUrls,
    });
    await newBlogContent.save();

    res.status(201).json({ msg: 'Blog created', blog: newBlog });
  } catch (err) {
    console.error('createBlog error:', err.message || err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, thumbnailImage, imageUrls } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ msg: 'Blog không tồn tại' });

    const isAdmin = req.session.user?.role === 'admin';
    const isAuthor = blog.author === req.session.user?.username;

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ msg: 'Không có quyền chỉnh sửa blog này' });
    }

    blog.title = title || blog.title;
    blog.thumbnailImage = thumbnailImage || blog.thumbnailImage;
    blog.updatedAt = new Date();
    await blog.save();

    const blogContent = await BlogContent.findOne({ blog: blog._id });
    if (blogContent) {
      blogContent.content = content || blogContent.content;
      blogContent.imageUrls = imageUrls || blogContent.imageUrls;
      await blogContent.save();
    } else {
      const newBlogContent = new BlogContent({
        blog: blog._id,
        content: content || '',
        imageUrls: imageUrls || []
      });
      await newBlogContent.save();
    }

    res.json({ msg: 'Cập nhật blog thành công', blog });
  } catch (err) {
    console.error('Lỗi updateBlog:', err);
    res.status(500).json({ msg: 'Lỗi server' });
  }
};


exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Delete blog with id:", id);
    console.log("User session:", req.session.user);
    console.log("Is admin:", req.session.admin);

    const blog = await Blog.findById(id);
    if (!blog) {
      console.log("Blog not found");
      return res.status(404).json({ msg: 'Blog not found' });
    }

    const isAdmin = !!req.session.admin;
    const isAuthor = blog.author === req.session.user?.username;

    // Nếu không phải admin và cũng không phải author thì cấm xóa
    if (!isAdmin && !isAuthor) {
      console.log("User is neither admin nor author");
      return res.status(403).json({ msg: 'Not authorized to delete this blog' });
    }

    await BlogContent.deleteOne({ blog: blog._id });
    await Comment.deleteMany({ blog: blog._id });
    await Blog.deleteOne({ _id: blog._id });

    console.log("Deleted blog successfully");
    res.json({ msg: 'Blog and all related content deleted' });
  } catch (err) {
    console.error("Error in deleteBlog:", err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// --- Comment ---

// Tạo comment cho blog
exports.createComment = async (req, res) => {
  try {
    const { blogId, username, email, content, parentComment } = req.body;
    const userId = req.session.user?.id ?? req.session.admin?.id;

    if (!blogId || !username || !email || !content) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    if (parentComment) {
      const parentExists = await Comment.findById(parentComment);
      if (!parentExists) {
          return res.status(400).json({ msg: 'Parent comment not found' });
      }
    }

    if (containsBadWords(content)) {
      return res.status(400).json({ 
        msg: 'Comment chứa từ ngữ không phù hợp',
        containsBadWords: true
      });
    }

    const newComment = new Comment({
        blog: blogId,
        username,
        email,
        userId,
        content,
        parentComment: parentComment || null
    });

    await newComment.save();

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ msg: 'Blog not found' });
    }

    // Tạo thông báo
    if (parentComment) {
      // Nếu là reply, gửi thông báo cho người viết comment gốc
      const parentCommentDoc = await Comment.findById(parentComment);
      if (parentCommentDoc && parentCommentDoc.userId.toString() !== userId.toString()) {
        await notificationController.createNotification(
          parentCommentDoc.userId, // ID của người viết comment gốc
          'REPLY',
          {
            message: `${username} đã phản hồi bình luận của bạn`,
            postId: blogId,
            commentId: newComment._id,
            replyId: newComment._id
          },
          blog.title,
          'BLOG'
        );
      }
    } else if (blog.authorId.toString() !== userId.toString()) {
      // Nếu là comment mới, gửi thông báo cho tác giả blog
      await notificationController.createNotification(
        blog.authorId, // ID của tác giả blog
        'COMMENT',
        {
          message: `${username} đã bình luận vào bài viết của bạn`,
          postId: blogId,
          commentId: newComment._id
        },
        blog.title,
        'BLOG'
      );
    }

    res.status(201).json({ msg: 'Comment added', comment: newComment });
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Lấy comment theo blog
exports.getCommentsByBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
    const comments = await Comment.find({ blog: blogId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getMyBlogs = async (req, res) => {
  try {
    const author = req.session.user?.username;
    const blogs = await Blog.find({ author }).sort({ createdAt: -1 }).lean();

    const blogIds = blogs.map(b => b._id);
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
    res.status(500).json({ msg: 'Lỗi khi lấy blog người dùng' });
  }
};

exports.searchBlogs = async (req, res) => {
  const query = req.query.q;
  const defaultList = req.query.default === 'true';

  try {
    const blogs = await Blog.find({
      approved: true,
      ...(defaultList
        ? {}
        : { title: { $regex: query || '', $options: 'i' } })
    })
    .sort({ createdAt: -1 })
    .limit(6);

    res.json(blogs);
  } catch (err) {
    console.error('Lỗi tìm kiếm blog:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
};