const StudySession = require('../models/StudySession');
const Interest = require('../models/Interest');
const { validateSessionData } = require('../utils/validators');

// Create a new study session
exports.createSession = async (req, res) => {
  try {
    const sessionData = req.body;
    const creator = req.user ? req.user._id : req.body.creator;

    // Validate session data
    const validationError = validateSessionData(sessionData);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const session = new StudySession({ ...sessionData, creator });
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all sessions with filtering and pagination
exports.getSessions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      subject,
      courseCode,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    const query = {};
    if (subject) query.subject = subject;
    if (courseCode) query.courseCode = courseCode;
    if (status) query.status = status;
    if (startDate && endDate) {
      query.dateTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (search) {
      query.$text = { $search: search };
    }

    const sessions = await StudySession.find(query)
      .populate('creator', 'name email')
      .sort({ dateTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await StudySession.countDocuments(query);

    res.json({
      sessions,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single session by ID
exports.getSessionById = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('interestedUsers.user', 'name email');

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a session
exports.updateSession = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.creator.toString() !== (req.user ? req.user._id.toString() : req.body.creator)) {
      return res.status(403).json({ error: 'Not authorized to update this session' });
    }
    const validationError = validateSessionData(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    Object.assign(session, req.body);
    await session.save();
    // Notify interested users about the update
    const interests = await Interest.find({ session: session._id });
    for (const interest of interests) {
      await interest.addNotification(
        'session_update',
        `The study session "${session.title}" has been updated`
      );
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a session
exports.deleteSession = async (req, res) => {
  try {
    const session = await StudySession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.creator.toString() !== (req.user ? req.user._id.toString() : req.body.creator)) {
      return res.status(403).json({ error: 'Not authorized to delete this session' });
    }
    // Notify interested users about the cancellation
    const interests = await Interest.find({ session: session._id });
    for (const interest of interests) {
      await interest.addNotification(
        'status_change',
        `The study session "${session.title}" has been cancelled`
      );
    }
    await session.remove();
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get session interests
exports.getSessionInterests = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await StudySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.creator.toString() !== (req.user ? req.user._id.toString() : req.body.creator)) {
      return res.status(403).json({ error: 'Not authorized to view session interests' });
    }
    const interests = await Interest.findSessionInterests(sessionId);
    res.json(interests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get upcoming sessions for the logged-in user within the next hour
exports.getUpcomingSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Find sessions where the user is the creator or is in interestedUsers (accepted)
    const sessions = await StudySession.find({
      dateTime: { $gte: now, $lte: oneHourLater },
      status: 'active',
      $or: [
        { creator: userId },
        { 'interestedUsers.user': userId, 'interestedUsers.status': 'accepted' }
      ]
    })
      .populate('creator', 'name email')
      .sort({ dateTime: 1 });

    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get next session details
exports.getNextSessionDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const now = new Date();
    
    const nextSession = await StudySession.findOne({
      _id: groupId,
      dateTime: { $gt: now },
      status: 'active'
    })
    .sort({ dateTime: 1 })
    .select('dateTime topics duration groupDetails');
    
    if (!nextSession) {
      return res.status(404).json({ error: 'No upcoming sessions found' });
    }
    
    res.json(nextSession);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update session topics
exports.updateSessionTopics = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { topics } = req.body;
    
    const session = await StudySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if user is authorized to update topics
    if (session.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update topics' });
    }
    
    session.topics = topics;
    await session.save();
    
    // Notify interested users about topic update
    const interests = await Interest.find({ session: session._id });
    for (const interest of interests) {
      await interest.addNotification(
        'session_update',
        `Topics for "${session.title}" have been updated`
      );
    }
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update group details
exports.updateGroupDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { groupDetails } = req.body;
    
    const session = await StudySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if user is authorized to update group details
    if (session.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update group details' });
    }
    
    session.groupDetails = {
      ...session.groupDetails,
      ...groupDetails
    };
    await session.save();
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all upcoming sessions for a group
exports.getGroupUpcomingSessions = async (req, res) => {
  try {
    const { groupId } = req.params;
    const now = new Date();
    
    const upcomingSessions = await StudySession.find({
      _id: groupId,
      dateTime: { $gt: now },
      status: 'active'
    })
    .sort({ dateTime: 1 })
    .populate('creator', 'name email')
    .select('title dateTime topics duration groupDetails');
    
    res.json(upcomingSessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Express interest in a session
exports.expressInterest = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await StudySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.addInterestedUser(userId)) {
      await session.save();
      res.status(201).json({ message: 'Interest expressed successfully' });
    } else {
      res.status(400).json({ error: 'Already expressed interest in this session' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update interest status
exports.updateInterestStatus = async (req, res) => {
  try {
    const { sessionId, userId } = req.params;
    const { status } = req.body;

    const session = await StudySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to update interest status' });
    }

    if (session.updateInterestStatus(userId, status)) {
      await session.save();
      res.json({ message: 'Interest status updated successfully' });
    } else {
      res.status(404).json({ error: 'Interest not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user interests
exports.getUserInterests = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const sessions = await StudySession.find({
      'interestedUsers.user': userId
    })
    .populate('creator', 'name email')
    .sort({ dateTime: 1 });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 