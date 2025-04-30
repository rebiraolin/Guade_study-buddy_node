const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyGoogleToken } = require('../utils/googleAuth');
const crypto = require('crypto');

exports.googleLogin = async (req, res) => {
  const { token } = req.body; // This is the Google ID token from the frontend

  try {
    // Verify the Google token using your utility function
    const payload = await verifyGoogleToken(token); // Make sure this utility is correctly implemented

    const { email, name, picture } = payload; // Get user info from Google payload

    // Check if a user with this email already exists
    let user = await User.findOne({ email });

    if (!user) {
      // If no user exists, create a new one
      // For Google users, password is not mandatory per schema, but saving a random hash can be a fallback
      const randomPassword = crypto.randomBytes(20).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10); // Use 10 rounds for random password

      user = await User.create({
        name,
        email,
        password: hashedPassword, // Store a generated password or leave undefined if schema allows
        profilePic: picture, // Save Google profile picture URL
        isGoogleUser: true, // Mark as a Google user
        // You might set default values for other fields or leave them undefined
      });
      console.log('New Google user created:', user.email);
    } else {
      // If user exists, update their profile pic or mark as google user if they weren't before
      if (!user.isGoogleUser) {
        user.isGoogleUser = true;
        // You might want to update name/profilePic from Google here too if they change
        if (picture) user.profilePic = picture;
        if (name && !user.name) user.name = name; // Optionally update name if not set
        await user.save();
        console.log('Existing user linked to Google:', user.email);
      } else {
        // Existing Google user logging in
        console.log('Existing Google user logged in:', user.email);
        // You might update profile pic/name here on subsequent logins too
        if (picture) user.profilePic = picture;
        if (name && !user.name) user.name = name;
        await user.save(); // Save if any updates were made
      }
    }

    // Generate a JWT for the user
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    // Send back the user info and token
    res.status(200).json({ result: user, token: jwtToken });
  } catch (err) {
    console.error('Google authentication failed:', err); // Log the specific error
    res
      .status(401)
      .json({ message: 'Google authentication failed', error: err.message }); // Provide error detail
  }
};
