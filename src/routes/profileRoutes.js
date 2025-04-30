const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure Multer for file uploads (using memory storage for simplicity)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Edit profile route
router.put(
  '/',
  authMiddleware,
  upload.single('profilePic'),
  profileController.editProfile
);

module.exports = router;
