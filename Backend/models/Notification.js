const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: ObjectId, ref: 'User' },  // Người nhận thông báo
    type: { 
      type: String, 
      enum: ['COMMENT', 'REPLY', 'APPROVE', 'REJECT'] 
    },
    content: {
      message: String,
      postId: { type: ObjectId, ref: 'Post' },
      commentId: { type: ObjectId, ref: 'Comment' },
      replyId: { type: ObjectId, ref: 'Reply' }
    },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    postTitle: { type: String },
    postType: { type: String, enum: ['BLOG', 'DOCUMENT'] },
  });
module.exports = mongoose.model('Notification', notificationSchema);