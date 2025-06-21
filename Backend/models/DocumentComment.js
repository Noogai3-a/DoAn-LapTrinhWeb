const mongoose = require('mongoose');

const documentCommentSchema = new mongoose.Schema({
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'DocumentComment' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DocumentComment', documentCommentSchema);