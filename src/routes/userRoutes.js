const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const {
  validateRegistration,
  validateLogin, // Ensure this middleware is correctly implemented
} = require('../middleware/userMiddleware');
const { authenticate } = require('../middleware/userMiddleware');

router.post('/register', validateRegistration, userController.registerUser);
router.post('/login', validateLogin, userController.loginUser); // Ensure validateLogin is correctly implemented
// Forgot password route
router.post('/forgot-password', userController.forgotPassword);

// Reset password route
router.post('/reset-password/:token', userController.resetPassword);
router.post('/signout', authenticate, userController.signout);

// ... (social login routes can remain commented out or be added here)

module.exports = router;