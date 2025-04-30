const mongoose = require('mongoose');

const interestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudySession',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  message: {
    type: String,
    trim: true,
    maxLength: 500
  },
  notifications: [{
    type: {
      type: String,
      enum: ['status_change', 'session_update', 'reminder'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  studyPreferences: {
    preferredTime: Date,
    preferredDuration: Number, // in minutes
    preferredFormat: {
      type: String,
      enum: ['in-person', 'virtual', 'hybrid'],
      default: 'hybrid'
    },
    additionalNotes: String
  }
}, {
  timestamps: true
});

// Indexes for faster queries
interestSchema.index({ user: 1, session: 1 }, { unique: true });
interestSchema.index({ status: 1 });
interestSchema.index({ 'notifications.read': 1 });


// Method to add a notification
interestSchema.methods.addNotification = function(type, message) {
  this.notifications.push({
    type,
    message,
    read: false
  });
  return this.save();
};

// Method to mark all notifications as read
interestSchema.methods.markNotificationsAsRead = function() {
  this.notifications.forEach(notification => {
    notification.read = true;
  });
  return this.save();
};

// Method to update status and add notification
interestSchema.methods.updateStatus = function(newStatus, message) {
  this.status = newStatus;
  return this.addNotification('status_change', message);
};

// Static method to find pending interests for a session
interestSchema.statics.findPendingInterests = function(sessionId) {
  return this.find({
    session: sessionId,
    status: 'pending'
  }).populate('user', 'name email');
};

// Static method to find all interests for a user
interestSchema.statics.findUserInterests = function(userId) {
  return this.find({ user: userId })
    .populate('session')
    .sort({ createdAt: -1 });
};

// Static method to find all interests for a session
interestSchema.statics.findSessionInterests = function(sessionId) {
  return this.find({ session: sessionId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
};
interestSchema.virtual('hasUnreadNotifications').get(function () {
  return this.notifications.some((n) => !n.read);
});

const Interest = mongoose.model('Interest', interestSchema);

module.exports = Interest; 