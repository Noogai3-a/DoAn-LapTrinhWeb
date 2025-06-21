const SubjectType = require('../models/SubjectType');

// Lấy danh sách tất cả loại môn
exports.getAllSubjectTypes = async (req, res) => {
  try {
    const types = await SubjectType.find({}, { _id: 0, typeSlug: 1, typeLabel: 1 });
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách loại môn.' });
  }
};

// Lấy danh sách môn học theo loại
exports.getSubjectsByType = async (req, res) => {
  const { typeSlug } = req.params;
  try {
    const type = await SubjectType.findOne({ typeSlug });
    if (!type) return res.status(404).json({ error: 'Không tìm thấy loại môn.' });
    res.json(type.subjects);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server khi lấy môn học.' });
  }
};

// Thêm môn học mới vào loại
exports.addSubjectToType = async (req, res) => {
  const { typeSlug } = req.params;
  const { subjectLabel, subjectSlug } = req.body;

  if (!subjectLabel || !subjectSlug) {
    return res.status(400).json({ error: 'Thiếu subjectLabel hoặc subjectSlug.' });
  }

  try {
    const type = await SubjectType.findOne({ typeSlug });
    if (!type) return res.status(404).json({ error: 'Không tìm thấy loại môn.' });

    const isDuplicate = type.subjects.some(s => s.subjectSlug === subjectSlug);
    if (isDuplicate) return res.status(409).json({ error: 'subjectSlug đã tồn tại.' });

    type.subjects.push({ subjectLabel, subjectSlug });
    await type.save();

    res.status(201).json({ message: 'Đã thêm môn học.', subjects: type.subjects });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server khi thêm môn học.' });
  }
};
