const mongoose = require('mongoose');
const slugify = require('slugify');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: { 
    type: String,
    unique: true },
  fileUrl: {
    type: String,
    required: true
  },
  imageUrl: String,
  subjectTypeSlug: {
    type: String,
    required: true,
    index: true
  },
  subjectTypeLabel: {
    type: String,
    required: true
  },
  subjectNameSlug: {
    type: String,
    required: true,
    index: true
  },
  subjectNameLabel: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    required: true
  },
  uploader: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  rejectionReason: String
});


module.exports = mongoose.model('Document', documentSchema);
