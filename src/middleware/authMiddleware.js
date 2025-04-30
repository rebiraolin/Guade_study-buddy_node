const jwt = require('jsonwebtoken');
const User = require('../models/User'); //  Your User model

const authMiddleware = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get the token from the header
      token = req.headers.authorization.split(' ')[1];

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token. Adjust the .select() as needed.
      req.user = await User.findById(decoded.userId).select('-password'); // Changed to decoded.userId

      next(); //  Call next() to go to the next middleware/controller
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized' });
      return; // Add return to prevent further execution
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
    return; // Add return here too
  }
};

module.exports = authMiddleware;