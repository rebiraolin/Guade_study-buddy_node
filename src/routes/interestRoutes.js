const express = require('express');
const router = express.Router();
const interestController = require('../controllers/interestController');
const authMiddleware = require('../middleware/authMiddleware');

// Test route for debugging
router.put('/test', (req, res) => {
  res.json({ message: 'Test route works!' });
});

// Interest management routes
router.post('/:sessionId', authMiddleware, interestController.expressInterest);
router.put('/:sessionId/users/:userId', authMiddleware, interestController.updateInterestStatus);
router.delete('/:sessionId', authMiddleware, interestController.cancelInterest);

// Get interests
router.get('/user', authMiddleware, interestController.getUserInterests);
router.get('/:sessionId/all', authMiddleware, interestController.getSessionInterests);

// Notification routes
router.get('/notifications', authMiddleware, interestController.getUserNotifications);
router.put('/notifications/read', authMiddleware, interestController.markNotificationsAsRead);

module.exports = router; 