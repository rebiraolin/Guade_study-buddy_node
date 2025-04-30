const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true, index: 'text' },
  videoUrl: { type: String, required: true }, // URL to the video (e.g., YouTube, Vimeo)
  uploadedBy: { type: String },
  uploadDate: { type: Date, default: Date.now },
  duration: { type: String },
  // Add any other relevant fields for videos
  subject: { type: String, index: 'text' },
});

module.exports = mongoose.model('Video', videoSchema);
