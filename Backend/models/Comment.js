const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  blog: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema);
