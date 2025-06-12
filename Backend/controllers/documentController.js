const Document = require('../models/Document');
const data = require('../data.json');

// Trả lại cả label (hiển thị cho client), không dùng để query
function getLabelsFromSlug(subjectTypeSlug, subjectNameSlug) {
  const subjectType = data[subjectTypeSlug];
  if (!subjectType || !subjectType.subjects) return null;

  const subject = subjectType.subjects.find(s => s.slug === subjectNameSlug);
  if (!subject) return null;

  return {
    subjectTypeLabel: subjectType.label,
    subjectNameLabel: subject.label
  };
}

exports.getDocumentsBySubject = async (req, res) => {
  const { subjectTypeSlug, subjectNameSlug } = req.params;

  console.log('[API] Nhận request:', subjectTypeSlug, subjectNameSlug);

  const labels = getLabelsFromSlug(subjectTypeSlug, subjectNameSlug);
  if (!labels) {
    return res.status(400).json({ message: 'Slug không hợp lệ.' });
  }

  // ❗ Query theo slug (đã lưu trong MongoDB)
  const query = {
    subjectTypeSlug,
    subjectNameSlug,
    status: 'pending'
  };

  console.log('[MongoDB Query]', query);

  try {
    const documents = await Document.find(query).select('title fileUrl').lean();

    if (!documents || documents.length === 0) {
      // Trả về mảng rỗng thay vì lỗi 404
      return res.status(200).json({
        subjectType: labels.subjectTypeLabel,
        subjectName: labels.subjectNameLabel,
        documents: [],
        message: 'Chưa có tài liệu phù hợp.'
      });
    }

    res.status(200).json({
      subjectType: labels.subjectTypeLabel,
      subjectName: labels.subjectNameLabel,
      documents
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



