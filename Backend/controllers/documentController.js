const Document = require('../models/Document');
const mongoose = require('mongoose');
const DocumentComment = require('../models/DocumentComment');
const { containsBadWords } = require('../utils/badWords');
const { analyzeSentiment } = require('../utils/sentiment');
const notificationController = require('./notificationController');
const User = require('../models/User');
const Admin = require('../models/Admin');


exports.getDocumentsBySubject = async (req, res) => {
  const { subjectTypeSlug, subjectNameSlug } = req.params;

  console.log('[API] Nhận request:', subjectTypeSlug, subjectNameSlug);

  try {
    const type = await SubjectType.findOne({ typeSlug: subjectTypeSlug });
    if (!type) {
      return res.status(404).json({ message: 'Không tìm thấy loại môn.' });
    }

    if (!Array.isArray(type.subjects)) {
      return res.status(500).json({ message: 'Dữ liệu môn học bị lỗi.' });
    }

    const subject = type.subjects.find(s => s.subjectSlug === subjectNameSlug);
    if (!subject) {
      return res.status(404).json({ message: 'Không tìm thấy môn học.' });
    }

    const documents = await Document.find({
      subjectTypeSlug,
      subjectNameSlug,
      status: 'approved'
    }).select('title slug fileUrl').lean();

    res.status(200).json({
      subjectType: type.typeLabel,
      subjectName: subject.subjectLabel,
      documents: documents || []
    });
  } catch (error) {
    console.error('[Lỗi truy vấn MongoDB]', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }

};


// Lấy tài liệu mới nhất (đã được duyệt)
exports.getLatestDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ status: 'approved' })
      .sort({ uploadDate: -1 })    // Sắp xếp theo ngày upload giảm dần
      .limit(6)
      .lean();

    res.status(200).json(documents);
  } catch (error) {
    console.error('[Lỗi getLatestDocuments]', error);
    res.status(500).json({ message: 'Lỗi server khi lấy tài liệu mới nhất.' });
  }
};

// Lấy tài liệu được xem nhiều nhất
exports.getPopularDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ status: 'approved' })
      .sort({ viewCount: -1 })     // viewCount phải tồn tại trong schema
      .limit(6)
      .lean();

    res.status(200).json(documents);
  } catch (error) {
    console.error('[Lỗi getPopularDocuments]', error);
    res.status(500).json({ message: 'Lỗi server khi lấy tài liệu phổ biến.' });
  }
};

exports.approveDocument = async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await Document.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json({ success: true, message: 'Tài liệu đã được duyệt', doc });
  } catch (err) {
    console.error('Lỗi khi duyệt tài liệu:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
};

exports.deleteDocumentById = async (req, res) => {
  try {
    const id = req.params.id;
    const objectId = new mongoose.Types.ObjectId(id);
    const doc = await Document.findById(objectId);

    if (!doc) {
      console.log("Không tìm thấy document ID:", objectId);
      return res.status(404).json({ msg: 'Tài liệu không tồn tại' });
    }
    await DocumentComment.deleteMany({ document: id });
    await Document.deleteOne({ _id: objectId });
    
    res.json({ msg: 'Tài liệu đã bị từ chối và xoá khỏi hệ thống.' });
  } catch (err) {
    console.error('Lỗi khi từ chối tài liệu:', err);
    res.status(500).json({ msg: 'Lỗi server khi từ chối tài liệu.' });
  }
};

exports.getMyDocuments = async (req, res) => {
  try {
    const username = req.session.user?.username || req.session.admin?.username;
    if (!username) return res.status(401).json({ msg: 'Not logged in' });

    const documents = await Document.find({ uploader: username }).sort({ uploadDate: -1 });
    res.json(documents);
  } catch (err) {
    console.error("Lỗi khi lấy tài liệu của user:", err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const id = req.params.id;
    const { title, description, subjectName } = req.body;

    const doc = await Document.findById(id);
    if (!doc) return res.status(404).json({ msg: 'Document không tồn tại' });

    const isAdmin = req.session.user?.role === 'admin';
    const isAuthor = doc.uploader === req.session.user?.username;

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ msg: 'Không có quyền chỉnh sửa tài liệu này' });
    }

    // Cập nhật metadata
    doc.title = title || doc.title;
    doc.description = description || doc.description;
    doc.subjectName = subjectName || doc.subjectName;

    // Nếu có file mới → thay thế file cũ
    if (req.file) {
      const oldPath = doc.pdfPath;
      doc.pdfPath = req.file.path;

      // Xoá file cũ nếu tồn tại
      if (oldPath && fs.existsSync(oldPath)) {
        fs.unlink(oldPath, (err) => {
          if (err) console.error('❌ Lỗi xoá file cũ:', err);
        });
      }
    }

    await doc.save();

    res.json({ msg: 'Cập nhật tài liệu thành công', document: doc });
  } catch (err) {
    console.error('Lỗi update document:', err);
    res.status(500).json({ msg: 'Lỗi server' });
  }
};

exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ msg: 'Tài liệu không tìm thấy' });
    }
    const comments = await DocumentComment.find({ document: document._id }).sort({ createdAt: -1 }).lean();
    res.json({ document, comments });
  } catch (err) {
    console.error('Lỗi khi lấy document theo ID:', err);
    res.status(500).json({ msg: 'Lỗi server' });
  }
};


exports.createDocumentComment = async (req, res) => {
  try {
    const { documentId, username, email, content, parentComment } = req.body;
    const userId = req.session.user?.id ?? req.session.admin?.id;

    if (!documentId || !username || !email || !content) {
      return res.status(400).json({ msg: 'All fields are required' });
    }

    if (parentComment) {
      const parentExists = await DocumentComment.findById(parentComment);
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

    const scores = await analyzeSentiment(content);
    const V = scores['Very Negative'] || 0;
    const N = scores['Negative'] || 0;
    const Neu = scores['Neutral'] || 0;

    const aggressive = (V + N) - Neu;
    const HARD_BLOCK = 0.50;

    if (aggressive >= HARD_BLOCK) {
      return res.status(400).json({
        msg: 'Comment bị đánh giá quá tiêu cực – vui lòng điều chỉnh!',
        sentiment: { V, N, Neu, aggressive }
      });
    }

    const newComment = new DocumentComment({
        document: documentId,
        username,
        email,
        userId,
        content,
        parentComment: parentComment || null
    });

    await newComment.save();

    const doc = await Document.findById(documentId);
    if (!doc) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    // Tạo thông báo
    const commenterId = userId ? userId.toString() : null;

    if (parentComment) {
      // Nếu là reply, gửi thông báo cho người viết comment gốc
      const parentCommentDoc = await DocumentComment.findById(parentComment);
      if (parentCommentDoc && parentCommentDoc.userId.toString() !== commenterId) {
        await notificationController.createNotification(
          parentCommentDoc.userId,
          'REPLY',
          {
            message: `${username} đã phản hồi bình luận của bạn`,
            postId: documentId,
            commentId: newComment._id,
            replyId: newComment._id
          },
          doc.title,
          'DOCUMENT'
        );
      }
    } else {
        // Xử lý thông báo cho bình luận mới
        const commenterId = userId ? userId.toString() : null;

        // Trường hợp tài liệu do "admin" đăng (uploader là string)
        if (typeof doc.uploader === 'string' && doc.uploader === 'admin') {
            const adminUsers = await Admin.find({});
            for (const adminUser of adminUsers) {
                // Không gửi thông báo nếu admin tự bình luận
                if (adminUser._id.toString() !== commenterId) {
                    try {
                        await notificationController.createNotification(
                            adminUser._id,
                            'COMMENT',
                            {
                                message: `${username} đã bình luận vào một tài liệu của quản trị viên`,
                                postId: documentId,
                                commentId: newComment._id
                            },
                            doc.title,
                            'DOCUMENT'
                        );
                    } catch (notifErr) {
                        console.error('❌ Lỗi gửi thông báo cho admin:', notifErr.message);
                    }
                }
            }
        } 
        // Trường hợp tài liệu do user đăng (uploader là ObjectId)
        else if (doc.uploader && mongoose.Types.ObjectId.isValid(doc.uploader) && doc.uploader.toString() !== commenterId) {
            try {
                await notificationController.createNotification(
                    doc.uploader,
                    'COMMENT',
                    {
                        message: `${username} đã bình luận vào tài liệu của bạn`,
                        postId: documentId,
                        commentId: newComment._id
                    },
                    doc.title,
                    'DOCUMENT'
                );
            } catch (notifErr) {
                console.error('❌ Lỗi gửi thông báo cho user:', notifErr.message);
            }
        }
    }

    res.status(201).json({ msg: 'Comment added', comment: newComment });
  } catch (err) {
    console.error('Error creating document comment:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// [THÊM MỚI] Lấy comment theo document
exports.getCommentsByDocumentId = async (req, res) => {
  try {
    const { documentId } = req.params;
    const comments = await DocumentComment.find({ document: documentId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};