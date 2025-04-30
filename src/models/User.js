const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    name: {
      // Consistent 'name' field
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['student', 'tutor', 'admin'],
      default: 'student',
    },
    subjects: [
      {
        type: String,
        trim: true,
      },
    ],
    academicLevel: {
      type: String,
      enum: ['undergraduate', 'graduate', 'phd', 'professional'],
      required: false, // <-- allow it to be optional
    },

    institution: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
      trim: true,
      default: '',
    },
    // --- Existing Optional Fields ---
    major: { type: String, required: false }, // Explicitly mark as not required
    year: { type: String, required: false },
    bio: { type: String, required: false },
    gender: {
      type: String,
      enum: ['boy', 'girl'], // Added more options for gender
      required: false,
    },

    // --- New Profile Fields (Optional) ---
    profilePic: { type: String, required: false }, // URL or path to profile picture
    location: { type: String, required: false },
    language: { type: String, required: false }, // Assuming a single primary language string for simplicity
    school: { type: String, required: false },
    interests: { type: [String], required: false }, // Array of strings for multiple interests

    // --- Password Reset & Google Auth Fields ---
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { type: Date, required: false },
    isGoogleUser: {
      type: Boolean,
      default: false,
      required: false,
    },
    preferences: {
      studyFormat: {
        type: String,
        enum: ['in-person', 'virtual', 'hybrid'],
        default: 'hybrid',
      },
      availableDays: [
        {
          type: String,
          enum: [
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday',
          ],
        },
      ],
      preferredTimes: [
        {
          start: String,
          end: String,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
// userSchema.pre('save', async function (next) {
//   if (!this.isModified('password')) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });


// Generate auth token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ userId: this._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: '1h', // Changed to 1h for consistency with login
  });
};

// Compare password
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Remove sensitive info when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
