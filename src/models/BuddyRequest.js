const mongoose = require('mongoose');

const buddyRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true
  },
  groupName: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate requests
buddyRequestSchema.index({ sender: 1, receiver: 1, groupName: 1 }, { unique: true });

const BuddyRequest = mongoose.model('BuddyRequest', buddyRequestSchema);

module.exports = BuddyRequest; 