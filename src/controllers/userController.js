const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Blacklist = require('../models/Blacklist');
const { sendResetPasswordEmail } = require('../utils/email'); // Adjust path if needed
const crypto = require('crypto');

const registerUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body; // Expecting username in request

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ message: 'Username already taken.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      name,
      username, // Using the provided username
      email,
      password: hashedPassword,
    });

    // Save user
    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Respond
    res.status(201).json({
      message: 'Account created successfully!',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
      }, // Include name in response
      token,
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'An error occurred during registration.' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid Credentials' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    res
      .status(200)
      .json({
        message: 'Login successful!',
        user: { id: user._id, username: user.username, email: user.email },
        token,
      });
  } catch (error) {
    console.error('Error during login: ', error);
    res.status(500).json({ message: 'An error occurred during login.' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Find the user by email. Use select('+resetPasswordToken +resetPasswordExpires') if they are selected: false in schema
    const user = await User.findOne({ email });

    // For security, always return a success message if the email exists,
    // but don't confirm if the user was found.
    if (!user) {
      console.log(`Attempted forgot password for non-existent email: ${email}`);
      return res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });
    }

    // Generate a unique reset token
    const resetToken = crypto.randomBytes(32).toString('hex'); // Use 32 bytes for more entropy

    // Set token and expiry on the user document
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour expiry

    // Save the updated user document
    await user.save();

    // Construct the reset link URL (Frontend URL)
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`; // Use frontend URL from env

    // Send the reset password email using your utility function
    // Make sure sendResetPasswordEmail handles actual email sending (e.g., Nodemailer)
    await sendResetPasswordEmail(user.email, resetLink);

    console.log(`Password reset email sent to ${user.email}`);
    res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error processing password reset request' });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  // Basic password validation
  if (!password || !confirmPassword) {
    return res
      .status(400)
      .json({ message: 'Password and confirm password are required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: 'Password must be at least 6 characters' });
  }

  try {
    // Find the user by the reset token and check if it's expired
    // Use select('+resetPasswordToken +resetPasswordExpires') if they are selected: false in schema
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Check if token is still valid
    });

    // If no user found or token expired
    if (!user) {
      return res
        .status(400)
        .json({ message: 'Password reset token is invalid or has expired.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user's password and clear reset token fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.isGoogleUser = false; // Assume setting password means they are no longer purely a Google user

    // Save the updated user document
    await user.save();

    console.log(`Password reset successfully for user: ${user.email}`);
    res
      .status(200)
      .json({
        message:
          'Password reset successfully. You can now log in with your new password.',
      });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

const signout = async (req, res) => {
  console.log('Signout function reached'); // Debug log

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const expires = new Date(decoded.exp * 1000);

    await Blacklist.create({
      token,
      expires,
      userId: decoded.userId, // Corrected to userId from decoded payload
      ipAddress: req.ip,
    });

    res.status(202).json({ message: 'Signout successful' });
  } catch (err) {
    console.error('Logout error:', err.message);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  signout,
};