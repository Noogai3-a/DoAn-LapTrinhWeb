const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thumbnailImage: { type: String, required: true },
  views: { type: Number, default: 0 }, 
  approved: { type: Boolean, default: false },
  category: { 
    type: String, 
    required: true,
    enum: [
      'Kiến thức & Học thuật',
      'Kỹ năng & Phát triển bản thân',
      'Kinh nghiệm học tập & Thi cử',
      'Trải nghiệm cá nhân & Cuộc sống',
      'Định hướng nghề nghiệp & Việc làm',
      'Hoạt động ngoại khóa & Cộng đồng',
      'Chủ đề khác'
    ]
  },
  subCategory: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Blog', blogSchema);
