const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/userMiddleware'); // Import only the authenticate middleware

//Get messages route
router.get('/messages', authenticate, chatController.getMessages);

module.exports = router;