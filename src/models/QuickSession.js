const mongoose = require('mongoose');
const StudySession = require('./StudySession');

const quickSessionSchema = new mongoose.Schema({
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  topicFocus: {
    type: String,
    required: true,
    trim: true
  },
  studyType: {
    type: String,
    enum: ['question', 'concept', 'problem-solving', 'review'],
    required: true
  },
  maxDuration: {
    type: Number, // in minutes
    required: true,
    default: 60
  },
  virtualMeetingLink: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Inherit all fields and methods from StudySession
const QuickSession = StudySession.discriminator('QuickSession', quickSessionSchema);

module.exports = QuickSession; 