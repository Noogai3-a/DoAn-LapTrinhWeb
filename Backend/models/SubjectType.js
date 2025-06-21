const mongoose = require('mongoose');

const Subject = new mongoose.Schema({
  subjectLabel: String,
  subjectSlug: String,
});

const SubjectType = new mongoose.Schema({
  typeSlug: { type: String, unique: true },
  typeLabel: String,
  subjects: [Subject]
});

module.exports = mongoose.model('SubjectType', SubjectType);