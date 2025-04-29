const mongoose = require('mongoose');

const buddyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  privacy: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitationLink: {
    type: String,
    trim: true
  },
  pendingRequests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, trim: true },
    requestedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

const BuddyGroup = mongoose.model('BuddyGroup', buddyGroupSchema);

module.exports = BuddyGroup; 