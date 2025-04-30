const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true, index: 'text' },
  content: { type: String, required: true, index: 'text' },
  author: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // Add any other relevant fields for articles
  subject: { type: String, index: 'text' },
  tags: [String],
});

module.exports = mongoose.model('Article', articleSchema);
