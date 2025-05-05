const StudySession = require('../models/StudySession');
const Interest = require('../models/Interest');
const { validateSessionData } = require('../utils/validators');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const agoraAppId = process.env.AGORA_APP_ID;
const agoraAppCertificate = process.env.AGORA_APP_CERTIFICATE;

exports.generateAgoraToken = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.userId; // Assuming your authenticate middleware sets req.user.userId

  if (!agoraAppId || !agoraAppCertificate) {
    console.error(
      'Agora App ID or App Certificate not configured in environment variables.'
    );
    return res.status(500).json({ error: 'Agora configuration error.' });
  }

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required.' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    // Verify if the study session exists (optional but recommended)
    const session = await StudySession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Study session not found.' });
    }

    // The channel name should be unique to the study session
    const channelName = sessionId;
    const uid = userId; // Use the user ID as the unique identifier

    const role = RtcRole.PUBLISHER; // Or RtcRole.SUBSCRIBER if the user is just joining
    const expirationTimeInSeconds = 3600; // Token expires in 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Build the token
    const token = RtcTokenBuilder.buildTokenWithUid(
      agoraAppId,
      agoraAppCertificate,
      channelName,
      parseInt(uid),
      role,
      privilegeExpiredTs
    );

    res.json({ token });
  } catch (error) {
    console.error('Error generating Agora token:', error);
    res.status(500).json({ error: 'Failed to generate Agora token.' });
  }
};
// Create a new study session
exports.createSession = async (req, res) => {
    try {
        const sessionData = req.body;
        const creatorId = req.user ? req.user.userId : req.body.creator; // Use req.user.userId

        if (!creatorId) {
            return res.status(400).json({ error: 'Creator ID is required' });
        }

        const session = new StudySession({ ...sessionData, creator: creatorId });
        await session.save();
        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all sessions with filtering and pagination
exports.getSessions = async (req, res) => {
    try {
        const { page = 1, limit = 10, subject, courseCode, status, startDate, endDate, search } = req.query;

        const query = {};
        if (subject) query.subject = subject;
        if (courseCode) query.courseCode = courseCode;
        if (status) query.status = status;
        if (startDate && endDate) {
            query.dateTime = { $gte: new Date(startDate), $lte: new Date(endDate) };
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

        res.json({ sessions, totalPages: Math.ceil(count / limit), currentPage: page });
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

        const requesterId = req.user ? req.user.userId : req.body.creator;

        if (session.creator && requesterId && session.creator.toString() !== requesterId) {
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

        const requesterId = req.user ? req.user.userId : req.body.creator;

        if (session.creator && requesterId && session.creator.toString() !== requesterId) {
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

        await StudySession.findByIdAndDelete(req.params.id); // Use findByIdAndDelete

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
        const requesterId = req.user ? req.user.userId : null;
        if (session.creator && requesterId && session.creator.toString() !== requesterId) {
            return res.status(403).json({ error: 'Not authorized to view session interests' });
        }
        const interests = await Interest.find({ session: sessionId }).populate('user', 'name email');
        res.json(interests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get upcoming sessions for the logged-in user within the next hour
exports.getUpcomingSessions = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : null;
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        const query = {
            dateTime: { $gte: now, $lte: oneHourLater },
            status: 'active',
            $or: []
        };

        if (userId) {
            query.$or.push({ creator: userId });
            query.$or.push({ 'interestedUsers.user': userId, 'interestedUsers.status': 'accepted' });
        }

        const sessions = await StudySession.find(query)
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

        const requesterId = req.user ? req.user.userId : null;
        if (session.creator && requesterId && session.creator.toString() !== requesterId) {
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

        const requesterId = req.user ? req.user.userId : null; // Get user ID from token

        if (session.creator && requesterId && session.creator.toString() !== requesterId) {
            return res.status(403).json({ error: 'Not authorized to update group details' });
        }

        session.groupDetails = { ...session.groupDetails, ...groupDetails };
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
        const userId = req.user ? req.user.userId : null;

        const session = await StudySession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.creator && userId && session.creator.toString() === userId) {
            return res.status(400).json({ error: 'Creator cannot express interest' });
        }

        const existingInterest = await Interest.findOne({ session: sessionId, user: userId });
        if (existingInterest) {
            return res.status(400).json({ error: 'Interest already expressed' });
        }

        const interest = new Interest({ session: sessionId, user: userId });
        await interest.save();

        // Optionally update the study session's interestedUsers array
        session.interestedUsers.push({ user: userId, status: 'pending', timestamp: new Date() });
        await session.save();

        res.status(201).json({ message: 'Interest expressed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateInterestStatus = async (req, res) => {
    try {
        const { sessionId, userId } = req.params;
        const { status } = req.body;

        const session = await StudySession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const requesterId = req.user ? req.user.userId : null;

        // Check if the user updating the status is the creator of the session
        if (session.creator && requesterId && session.creator.toString() !== requesterId) {
            return res.status(403).json({ error: 'Not authorized to update interest status' });
        }

        const interest = await Interest.findOne({ session: sessionId, user: userId });
        if (!interest) {
            return res.status(404).json({ error: 'Interest record not found' });
        }

        interest.status = status;
        await interest.save();

        res.json(interest);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// Get user interests
exports.getUserInterests = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : null;

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