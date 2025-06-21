const Document = require('../models/Document');
const DocumentComment = require('../models/DocumentComment'); // [THÊM]
const mongoose = require('mongoose'); // [THÊM]
const fs = require('fs');
const path = require('path');

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
    const objectId = new mongoose.Types.ObjectId(id);
    const doc = await Document.findById(objectId);

    if (!doc) {
      console.log("Không tìm thấy document ID:", objectId);
      return res.status(404).json({ msg: 'Tài liệu không tồn tại' });
    }

    // Thêm dòng này để xóa comment
    await DocumentComment.deleteMany({ document: objectId });

    await Document.deleteOne({ _id: objectId });
    res.json({ msg: 'Tài liệu đã bị từ chối và xoá khỏi hệ thống.' });
  } catch (err) {
    console.error('Lỗi khi từ chối tài liệu:', err);
    res.status(500).json({ msg: 'Lỗi server khi từ chối tài liệu.' });
  }
};


exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ msg: 'Tài liệu không tìm thấy' });
        }
        
        // Thêm logic lấy comments
        const comments = await DocumentComment.find({ document: document._id }).sort({ createdAt: -1 }).lean();

        res.json({ document, comments }); // Trả về cả document và comments
    } catch (err) {
      console.error('Lỗi khi lấy tài liệu:', error);
      res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getDocumentBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;
    const doc = await Document.findOne({ slug }).lean();

    if (!doc) {
      return res.status(404).json({ message: 'Tài liệu không tồn tại' });
    }
    console.log('Tìm được:', doc);

    const comments = await DocumentComment.find({ document: doc._id }).sort({ createdAt: -1 }).lean();

    res.json({ document: doc, comments });
  } catch (error) {
    console.error('Lỗi khi lấy tài liệu:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};