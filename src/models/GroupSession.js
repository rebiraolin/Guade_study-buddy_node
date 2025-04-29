const mongoose = require('mongoose');
const StudySession = require('./StudySession');

const groupSessionSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
    trim: true
  },
  groupSize: {
    type: Number,
    required: true,
    min: 2
  },
  studyFormat: {
    type: String,
    enum: ['lecture', 'discussion', 'practice', 'review', 'mixed'],
    default: 'mixed'
  },
  prerequisites: [{
    type: String,
    trim: true
  }],
  materials: [{
    title: String,
    description: String,
    link: String
  }],
  agenda: [{
    topic: String,
    duration: Number, // in minutes
    description: String
  }],
  virtualMeetingLink: {
    type: String,
    trim: true
  },
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly'],
      default: 'weekly'
    },
    endDate: Date
  }
}, {
  timestamps: true
});

// Inherit all fields and methods from StudySession
const GroupSession = StudySession.discriminator('GroupSession', groupSessionSchema);

module.exports = GroupSession;