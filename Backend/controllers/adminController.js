const Document = require('../models/Document');
const SubjectType = require('../models/SubjectType');

// 👇 Thêm tra label từ slug
async function getLabelsFromSlug(subjectTypeSlug, subjectNameSlug) {
  const subjectType = await SubjectType.findOne({ typeSlug: subjectTypeSlug });

  if (!subjectType) return null;

  const subject = subjectType.subjects.find(s => s.subjectSlug === subjectNameSlug);
  if (!subject) return null;

  return {
    subjectTypeLabel: subjectType.typeLabel,
    subjectNameLabel: subject.subjectLabel
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

    const labels = await getLabelsFromSlug(subjectTypeSlug, subjectNameSlug);
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
