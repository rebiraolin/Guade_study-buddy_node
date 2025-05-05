const express = require('express');
const router = express.Router();
const studySessionController = require('../controllers/studySessionController');
const { authenticate } = require('../middleware/userMiddleware'); // ✅ destructure authenticate
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
// Apply authentication middleware to all routes
router.use(authenticate); // ✅ now this is a function

// Specific routes first
router.get('/upcoming/hour', studySessionController.getUpcomingSessions);
router.get('/user/interests', studySessionController.getUserInterests);

// Group and session management routes
router.get(
  '/groups/:groupId/next',
  studySessionController.getNextSessionDetails
);
router.get(
  '/groups/:groupId/upcoming',
  studySessionController.getGroupUpcomingSessions
);
router.get(
  '/sessions/:sessionId/agora-token',
  authenticate,
  studySessionController.generateAgoraToken
);
router.put(
  '/sessions/:sessionId/topics',
  studySessionController.updateSessionTopics
);
router.put(
  '/sessions/:sessionId/group-details',
  studySessionController.updateGroupDetails
);

// Filter routes
router.get('/filter/subject/:subject', (req, res) => {
  req.query.subject = req.params.subject;
  studySessionController.getSessions(req, res);
});

router.get('/filter/course/:courseCode', (req, res) => {
  req.query.courseCode = req.params.courseCode;
  studySessionController.getSessions(req, res);
});

router.get('/filter/type/:sessionType', (req, res) => {
  req.query.sessionType = req.params.sessionType;
  studySessionController.getSessions(req, res);
});

router.get('/filter/status/:status', (req, res) => {
  req.query.status = req.params.status;
  studySessionController.getSessions(req, res);
});

router.get('/filter/date-range', (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ error: 'Both startDate and endDate are required' });
  }
  studySessionController.getSessions(req, res);
});

// Search route
router.get('/search/:query', (req, res) => {
  req.query.search = req.params.query;
  studySessionController.getSessions(req, res);
});

// Basic CRUD routes
router.post('/', studySessionController.createSession);
router.get('/', studySessionController.getSessions);

// Interest management routes with dynamic parameters
router.post('/:sessionId/interest', studySessionController.expressInterest);
router.put(
  '/:sessionId/interest/:userId',
  studySessionController.updateInterestStatus
);
router.get('/:sessionId/interests', studySessionController.getSessionInterests);

// Dynamic parameter routes last
router.get('/:id', studySessionController.getSessionById);
router.put('/:id', studySessionController.updateSession);
router.delete('/:id', studySessionController.deleteSession);

module.exports = router;
