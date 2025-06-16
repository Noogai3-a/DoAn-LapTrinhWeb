const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
      type: String, 
      enum: ['COMMENT', 'REPLY', 'APPROVE', 'REJECT'] ,
      required: true
    },
    content: {
      message: { type: String, required: true },
      postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
      commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
      replyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reply' }
    },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    postTitle: { type: String },
    postType: { type: String, enum: ['BLOG', 'DOCUMENT'] },
  });
  
module.exports = mongoose.model('Notification', notificationSchema);