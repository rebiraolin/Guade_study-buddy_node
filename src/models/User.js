const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['student', 'tutor', 'admin'],
    default: 'student'
  },
  subjects: [{
    type: String,
    trim: true
  }],
  academicLevel: {
    type: String,
    enum: ['undergraduate', 'graduate', 'phd', 'professional'],
    required: true
  },
  institution: {
    type: String,
    trim: true
  },
  profileImage: {
    type: String,
    trim: true,
    default: ''
  },
  preferences: {
    studyFormat: {
      type: String,
      enum: ['in-person', 'virtual', 'hybrid'],
      default: 'hybrid'
    },
    availableDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    preferredTimes: [{
      start: String,
      end: String
    }]
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Generate auth token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { userId: this._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Compare password
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Remove sensitive info when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User; 