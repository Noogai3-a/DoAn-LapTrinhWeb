const Document = require('../models/Document');
const data = require('../data.json');

// 👇 Thêm tra label từ slug
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

// 👇 Hàm xử lý upload nhiều tài liệu
exports.uploadMultipleDocuments = async (req, res) => {
  console.log('[uploadMultipleDocuments] ĐÃ GỌI VÀO');
  try {
    const { titlePrefix, documentType, subjectTypeSlug, subjectNameSlug } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Chưa chọn file nào' });
    }

    const labels = getLabelsFromSlug(subjectTypeSlug, subjectNameSlug);
    if (!labels) {
      return res.status(400).json({ message: 'Slug không hợp lệ hoặc không tìm thấy label' });
    }

    const documents = files.map((file, index) => ({
      title: titlePrefix?.trim()
        ? `${titlePrefix.trim()} ${index + 1}`
        : file.originalname.replace(/\.[^/.]+$/, ''), // bỏ phần mở rộng .pdf
      documentType,
      subjectTypeSlug,
      subjectNameSlug,
      subjectTypeLabel: labels.subjectTypeLabel,
      subjectNameLabel: labels.subjectNameLabel,
      fileUrl: `/uploads/${file.filename.replace(/\\/g, '/')}`,
      uploader: 'Admin',
      status: 'approved',
      uploadDate: new Date()
    }));


    const inserted = await Document.insertMany(documents);

    res.json({ success: true, insertedCount: inserted.length, documents: inserted });
  } catch (err) {
    console.error('[uploadMultipleDocuments ERROR]', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Lỗi máy chủ khi upload nhiều file' });
    }
  }
};
