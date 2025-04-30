const Interest = require('../models/Interest');
const StudySession = require('../models/StudySession');

// Express interest in a session
const expressInterest = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.userId; // Get userId from authenticated user's token
        const { message, studyPreferences } = req.body;

        // Check if session exists
        const session = await StudySession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Check if session is full
        if (session.isFull) {
            return res.status(400).json({ error: 'Session is full' });
        }

        // Check if user already expressed interest
        const existingInterest = await Interest.findOne({
            user: userId,
            session: sessionId
        });

        if (existingInterest) {
            return res.status(400).json({ error: 'Already expressed interest in this session' });
        }

        // Create new interest
        const interest = new Interest({
            user: userId,
            session: sessionId,
            message,
            studyPreferences
        });

        await interest.save();

        // Add to session's interested users
        session.addInterestedUser(userId);
        await session.save();

        res.status(201).json(interest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update interest status
const updateInterestStatus = async (req, res) => {
  try {
    const { sessionId, userId } = req.params;
    const { status, message } = req.body;

    // Check if session exists
    const session = await StudySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Find the interest
    const interest = await Interest.findOne({ user: userId, session: sessionId });
    if (!interest) {
      return res.status(404).json({ error: 'Interest not found' });
    }

    // Update status and add notification
    await interest.updateStatus(status, message);

    // Update session participants count if accepted
    if (status === 'accepted') {
      session.currentParticipants += 1;
      if (session.isFull) {
        session.status = 'full';
      }
      await session.save();
    }

    res.json(interest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's interests
const getUserInterests = async (req, res) => {
  try {
    const { userId } = req.query;
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    const interests = await Interest.find(query)
      .populate('session')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .exec();

    const count = await Interest.countDocuments(query);

    res.json({
      interests,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalResults: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get session interests
const getSessionInterests = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    // Check if session exists
    const session = await StudySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const query = { session: sessionId };
    if (status) {
      query.status = status;
    }

    const interests = await Interest.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .exec();

    const count = await Interest.countDocuments(query);

    res.json({
      interests,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalResults: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel interest
const cancelInterest = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;

    // Find the interest
    const interest = await Interest.findOne({ user: userId, session: sessionId });
    if (!interest) {
      return res.status(404).json({ error: 'Interest not found' });
    }

    // Update status to cancelled
    await interest.updateStatus('cancelled', 'Interest cancelled by user');

    // Remove from session's interested users
    const session = await StudySession.findById(sessionId);
    if (session) {
      const userIndex = session.interestedUsers.findIndex(
        user => user.user.toString() === userId.toString()
      );
      if (userIndex !== -1) {
        session.interestedUsers.splice(userIndex, 1);
        await session.save();
      }
    }

    res.json({ message: 'Interest cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's notifications
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user._id; // Get userId from authenticated user
    const { page = 1, limit = 10, unreadOnly = false } = req.query;

    // Find all interests for the user
    const query = { user: userId };
    
    const interests = await Interest.find(query)
      .populate('session', 'title description dateTime')
      .sort({ 'notifications.createdAt': -1 })
      .exec();

    // Extract and flatten all notifications
    let notifications = interests.reduce((acc, interest) => {
      const sessionNotifications = interest.notifications.map(notification => ({
        ...notification.toObject(),
        sessionTitle: interest.session.title,
        sessionId: interest.session._id,
        interestId: interest._id
      }));
      return [...acc, ...sessionNotifications];
    }, []);

    // Filter unread notifications if requested
    if (unreadOnly === 'true') {
      notifications = notifications.filter(notification => !notification.read);
    }

    // Sort by date
    notifications.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedNotifications = notifications.slice(startIndex, endIndex);

    res.json({
      notifications: paginatedNotifications,
      totalPages: Math.ceil(notifications.length / parseInt(limit)),
      currentPage: parseInt(page),
      totalResults: notifications.length,
      unreadCount: notifications.filter(n => !n.read).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark notifications as read
const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user._id; // Get userId from authenticated user
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds)) {
      return res.status(400).json({ error: 'notificationIds must be an array' });
    }

    // Find all interests for the user that contain the specified notifications
    const interests = await Interest.find({
      user: userId,
      'notifications._id': { $in: notificationIds }
    });

    // Update the read status of specified notifications
    const updatePromises = interests.map(interest => {
      interest.notifications.forEach(notification => {
        if (notificationIds.includes(notification._id.toString())) {
          notification.read = true;
        }
      });
      return interest.save();
    });

    await Promise.all(updatePromises);

    res.json({
      message: 'Notifications marked as read successfully',
      updatedCount: notificationIds.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  expressInterest,
  updateInterestStatus,
  getUserInterests,
  getSessionInterests,
  cancelInterest,
  getUserNotifications,
  markNotificationsAsRead,
};

