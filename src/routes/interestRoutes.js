const express = require('express');
const router = express.Router();
const interestController = require('../controllers/interestController');
const { authenticate } = require('../middleware/userMiddleware');

// Test route
router.put('/test', (req, res) => {
  res.json({ message: 'Test route works!' });
});

// Interest management routes
router.post('/:sessionId', authenticate, interestController.expressInterest);
router.put(
  '/:sessionId/users/:userId',
  authenticate,
  interestController.updateInterestStatus
);
router.delete('/:sessionId', authenticate, interestController.cancelInterest);

router.get('/user', authenticate, interestController.getUserInterests);
router.get(
  '/:sessionId/all',
  authenticate,
  interestController.getSessionInterests
);

// Notification routes
router.get(
  '/notifications',
  authenticate,
  interestController.getUserNotifications
);
router.put(
  '/notifications/read',
  authenticate,
  interestController.markNotificationsAsRead
);

module.exports = router;
