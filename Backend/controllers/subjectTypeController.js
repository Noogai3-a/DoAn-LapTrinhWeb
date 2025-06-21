const SubjectType = require('../models/SubjectType');

// Lấy danh sách tất cả loại môn
exports.getAllSubjectTypes = async (req, res) => {
  console.log('[GET] /api/subject-types - Lấy tất cả loại môn');
  try {
    const types = await SubjectType.find({}, { _id: 0, typeSlug: 1, typeLabel: 1, subjects: 1 });
    console.log('→ Kết quả truy vấn:', types);
    res.json(types);
  } catch (err) {
    console.error('❌ Lỗi khi lấy tất cả loại môn:', err);
    res.status(500).json({ error: 'Lỗi server khi lấy danh sách loại môn.' });
  }
};

// Lấy danh sách môn học theo loại
exports.getSubjectsByType = async (req, res) => {
  const { typeSlug } = req.params;
  console.log(`[GET] /api/subject-types/${typeSlug}/subjects - Lấy danh sách môn theo loại`);
  try {
    const type = await SubjectType.findOne({ typeSlug });
    if (!type) {
      console.warn(`⚠️ Không tìm thấy loại môn với slug: ${typeSlug}`);
      return res.status(404).json({ error: 'Không tìm thấy loại môn.' });
    }
    console.log(`→ Đã tìm thấy loại môn: ${type.typeLabel}, số môn: ${type.subjects.length}`);
    res.json(type.subjects);
  } catch (err) {
    console.error('❌ Lỗi khi lấy môn học:', err);
    res.status(500).json({ error: 'Lỗi server khi lấy môn học.' });
  }
};

// Thêm môn học mới vào loại
exports.addSubjectToType = async (req, res) => {
  const { typeSlug } = req.params;
  const { subjectLabel, subjectSlug } = req.body;
  console.log(`[POST] /api/subject-types/${typeSlug}/subjects - Thêm môn mới:`, { subjectLabel, subjectSlug });

  if (!subjectLabel || !subjectSlug) {
    console.warn('⚠️ Thiếu subjectLabel hoặc subjectSlug trong body');
    return res.status(400).json({ error: 'Thiếu subjectLabel hoặc subjectSlug.' });
  }

  try {
    const type = await SubjectType.findOne({ typeSlug });
    if (!type) {
      console.warn(`⚠️ Không tìm thấy loại môn với slug: ${typeSlug}`);
      return res.status(404).json({ error: 'Không tìm thấy loại môn.' });
    }

    const isDuplicate = type.subjects.some(s => s.subjectSlug === subjectSlug);
    if (isDuplicate) {
      console.warn(`⚠️ subjectSlug "${subjectSlug}" đã tồn tại trong loại ${typeSlug}`);
      return res.status(409).json({ error: 'subjectSlug đã tồn tại.' });
    }

    type.subjects.push({ subjectLabel, subjectSlug });
    await type.save();

    console.log(`✅ Đã thêm môn "${subjectLabel}" vào loại "${type.typeLabel}"`);
    res.status(201).json({ message: 'Đã thêm môn học.', subjects: type.subjects });
  } catch (err) {
    console.error('❌ Lỗi khi thêm môn học:', err);
    res.status(500).json({ error: 'Lỗi server khi thêm môn học.' });
  }
};
