const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');
const { deleteFileFromDrive } = require('../uploads/googleDrive');

exports.getDocumentsForAdmin = async (req, res) => {
  try {
    const approvedDocuments = await Document.find({ status: 'approved' }).sort({ uploadDate: -1 }).lean();
    const pendingDocuments = await Document.find({ status: { $in: ['pending', 'rejected'] } }).sort({ uploadDate: -1 }).lean();

    // Thêm field chung để frontend nhận dạng
    const mapDoc = doc => ({
      ...doc,
      type: 'document',
      approved: doc.status === 'approved',
      createdAt: doc.uploadDate,
      author: doc.uploader,
      subject: doc.subjectName
    });

    res.json({
      approvedDocuments: approvedDocuments.map(mapDoc),
      pendingDocuments: pendingDocuments.map(mapDoc)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Lỗi khi lấy tài liệu' });
  }
};

exports.approveDocument = async (req, res) => {
  try {
    const id = req.params.id;
    console.log('ID nhận được:', id);

    const doc = await Document.findById(id);
    console.log('Document tìm thấy:', doc);

    if (!doc) {
      return res.status(404).json({ msg: 'Tài liệu không tồn tại' });
    }
    if (doc.status === 'approved') {
      return res.status(400).json({ msg: 'Tài liệu đã được duyệt' });
    }

    doc.status = 'approved';
    await doc.save();

    res.json({ msg: 'Duyệt tài liệu thành công', document: doc });
  } catch (err) {
    console.error('Lỗi duyệt tài liệu:', err);
    res.status(500).json({ msg: 'Lỗi khi duyệt tài liệu' });
  }
};

exports.deleteDocumentById = async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await Document.findById(id);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Xoá file trên Google Drive nếu có
    if (doc.fileUrl.startsWith('https://drive.google.com/uc?id=')) {
      const match = doc.fileUrl.match(/id=([^&]+)/);
      if (match) {
        await deleteFileFromDrive(match[1]);
      }
    }

    // Xoá khỏi database
    await Document.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting document:', err);
    res.status(500).json({ error: 'Server error' });
  }
};



exports.getDocumentById = async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await Document.findById(id).lean();

    if (!doc) {
      return res.status(404).json({ message: 'Tài liệu không tồn tại' });
    }

    res.json(doc);
  } catch (error) {
    console.error('Lỗi khi lấy tài liệu:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

exports.getDocumentBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;
    const doc = await Document.findOne({ slug }).lean();
    console.log('Received slug:', req.params.slug);

    if (!doc) {
      return res.status(404).json({ message: 'Tài liệu không tồn tại' });
    }
    console.log('Tìm được:', doc);

    res.json(doc);
  } catch (error) {
    console.error('Lỗi khi lấy tài liệu:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};