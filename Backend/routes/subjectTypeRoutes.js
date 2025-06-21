const express = require('express');
const router = express.Router();
const subjectTypeController = require('../controllers/subjectController');

// Lấy tất cả loại môn
router.get('/', subjectTypeController.getAllSubjectTypes);

// Lấy danh sách môn theo loại
router.get('/:typeSlug/subjects', subjectTypeController.getSubjectsByType);

// Thêm môn mới vào loại
router.post('/:typeSlug/subjects', subjectTypeController.addSubjectToType);

module.exports = router;