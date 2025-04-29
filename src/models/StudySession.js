const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    index: true // For faster filtering
  },
  courseCode: {
    type: String,
    required: true,
    trim: true,
    index: true // For faster filtering
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // For faster filtering by creator
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
    index: true // For faster filtering
  },
  currentParticipants: {
    type: Number,
    default: 1, // Including creator
    index: true // For filtering by current participants
  },
  dateTime: {
    type: Date,
    required: true,
    index: true // For faster filtering and sorting
  },
  duration: {
    type: Number, // in minutes
    required: true,
    index: true // For filtering by duration
  },
  topics: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String
  }],
  groupDetails: {
    language: {
      type: String,
      default: 'English',
      trim: true
    },
    courseStudied: {
      type: String,
      trim: true
    },
    regularTime: {
      start: String,
      end: String
    },
    imageUrl: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  interestedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  studyMaterials: [{
    title: String,
    description: String,
    link: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for common query patterns
studySessionSchema.index({ subject: 1, status: 1 });
studySessionSchema.index({ courseCode: 1, status: 1 });
studySessionSchema.index({ dateTime: 1, status: 1 });
studySessionSchema.index({ creator: 1, status: 1 });

// Index for text search with weights
studySessionSchema.index({ 
  title: 'text', 
  description: 'text', 
  subject: 'text', 
  courseCode: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    subject: 5,
    courseCode: 5,
    description: 3,
    tags: 2
  },
  name: 'text_search_index'
});

// Virtual for checking if session is full
studySessionSchema.virtual('isFull').get(function() {
  return this.currentParticipants >= this.maxParticipants;
});

// Method to add interested user
studySessionSchema.methods.addInterestedUser = function(userId) {
  if (!this.interestedUsers.some(interest => interest.user.toString() === userId.toString())) {
    this.interestedUsers.push({ user: userId });
    return true;
  }
  return false;
};

// Method to update interest status
studySessionSchema.methods.updateInterestStatus = function(userId, status) {
  const interest = this.interestedUsers.find(interest => 
    interest.user.toString() === userId.toString()
  );
  if (interest) {
    interest.status = status;
    return true;
  }
  return false;
};

// Static method to find active sessions
studySessionSchema.statics.findActiveSessions = function() {
  return this.find({ 
    status: 'active',
    dateTime: { $gt: new Date() }
  });
};

// Static method for advanced search with filters
studySessionSchema.statics.advancedSearch = function(filters, page = 1, limit = 10) {
  const query = {};
  
  // Apply filters
  if (filters.subject) query.subject = filters.subject;
  if (filters.courseCode) query.courseCode = filters.courseCode;
  if (filters.status) query.status = filters.status;
  if (filters.sessionType) query.__t = filters.sessionType;
  if (filters.creator) query.creator = filters.creator;
  
  // Date range filter
  if (filters.startDate || filters.endDate) {
    query.dateTime = {};
    if (filters.startDate) query.dateTime.$gte = new Date(filters.startDate);
    if (filters.endDate) query.dateTime.$lte = new Date(filters.endDate);
  }
  
  // Duration filter
  if (filters.minDuration) query.duration = { $gte: filters.minDuration };
  if (filters.maxDuration) query.duration = { ...query.duration, $lte: filters.maxDuration };
  
  // Text search
  if (filters.search) {
    query.$text = { $search: filters.search };
  }
  
  // Execute query with pagination
  return this.find(query)
    .populate('creator', 'name email')
    .sort(filters.sortBy || { dateTime: 1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .exec();
};

const StudySession = mongoose.model('StudySession', studySessionSchema);

module.exports = StudySession; 