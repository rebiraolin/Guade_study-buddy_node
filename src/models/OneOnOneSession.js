const mongoose = require('mongoose');
const StudySession = require('./StudySession');

const oneOnOneSessionSchema = new mongoose.Schema({
  preferredStudyPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  preferredStudyTopics: [{
    type: String,
    trim: true
  }],
  preferredStudyStyle: {
    type: String,
    enum: ['discussion', 'practice', 'review', 'mixed'],
    default: 'mixed'
  },
  languagePreference: {
    type: String,
    default: 'English'
  },
  virtualMeetingLink: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Inherit all fields and methods from StudySession
const OneOnOneSession = StudySession.discriminator('OneOnOneSession', oneOnOneSessionSchema);

module.exports = OneOnOneSession; 