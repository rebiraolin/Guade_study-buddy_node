const StudySession = require('../models/StudySession');
const User = require('../models/User');
const Interest = require('../models/Interest');
const BuddyGroup = require('../models/BuddyGroup');
const crypto = require('crypto');

exports.getPopularBuddies = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Aggregate users who have created the most sessions
    const popular = await StudySession.aggregate([
      { $group: { _id: '$creator', sessionCount: { $sum: 1 } } },
      { $sort: { sessionCount: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          userId: '$_id',
          name: '$userInfo.name',
          subjects: '$userInfo.subjects',
          profileImage: '$userInfo.profileImage', // if exists
          sessionCount: 1,
        },
      },
    ]);

    res.json(popular);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get 'My Buddies': users the current user has sessions with (hosted or accepted)
exports.getMyBuddies = async (req, res) => {
  try {
    const { userId, status } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    // 1. Find sessions the user is hosting
    const hostedSessions = await StudySession.find({ creator: userId }).select(
      '_id participants'
    );
    const hostedSessionIds = hostedSessions.map((s) => s._id.toString());
    const hostedParticipantIds = hostedSessions.flatMap(
      (s) => s.participants || []
    );

    // 2. Find users the current user has joined as participant (optionally filter by status)
    const interestQuery = { user: userId };
    if (status) interestQuery.status = status;
    const acceptedInterests = await Interest.find(interestQuery).select(
      'session'
    );
    const joinedSessionIds = acceptedInterests.map((i) => i.session);
    const joinedSessions = await StudySession.find({
      _id: { $in: joinedSessionIds },
    }).select('creator participants');
    const joinedCreatorIds = joinedSessions.map((s) => s.creator);
    const joinedParticipantIds = joinedSessions.flatMap(
      (s) => s.participants || []
    );

    // 3. Combine all user IDs (excluding self)
    const allBuddyIds = new Set([
      ...hostedParticipantIds.map((id) => id.toString()),
      ...joinedCreatorIds.map((id) => id.toString()),
      ...joinedParticipantIds.map((id) => id.toString()),
    ]);
    allBuddyIds.delete(userId);

    // 4. Fetch user info
    const buddies = await User.find({
      _id: { $in: Array.from(allBuddyIds) },
    }).select('name subjects profileImage');

    res.json(buddies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search buddies by name or subject
exports.searchBuddies = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query)
      return res.status(400).json({ error: 'query parameter is required' });

    // Case-insensitive search for name or subject
    const regex = new RegExp(query, 'i');
    const buddies = await User.find({
      $or: [{ name: regex }, { subjects: regex }],
    }).select('name subjects profileImage');

    res.json(buddies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get buddy profile and their sessions
exports.getBuddyProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    // Get user profile
    const user = await User.findById(userId).select(
      'name subjects profileImage academicLevel institution'
    );
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get sessions hosted by this user
    const sessions = await StudySession.find({ creator: userId }).select(
      'title subject courseCode dateTime duration location language'
    );

    res.json({
      user,
      sessions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all pending interests for sessions the user hosts (buddy requests)
exports.getBuddyRequests = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    // Find all sessions hosted by the user
    const hostedSessions = await StudySession.find({ creator: userId }).select(
      '_id title subject'
    );
    const hostedSessionIds = hostedSessions.map((s) => s._id);

    // Find all pending interests for these sessions
    const pendingInterests = await Interest.find({
      session: { $in: hostedSessionIds },
      status: 'pending',
    })
      .populate('user', 'name subjects profileImage')
      .populate('session', 'title subject');

    // Format response
    const requests = pendingInterests.map((interest) => ({
      interestId: interest._id,
      user: interest.user,
      session: interest.session,
      message: interest.message,
      createdAt: interest.createdAt,
    }));

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new buddy group
exports.createBuddyGroup = async (req, res) => {
  try {
    const { name, description, tags, privacy, creator } = req.body;
    if (!name || !creator)
      return res.status(400).json({ error: 'name and creator are required' });
    const invitationLink = crypto.randomBytes(16).toString('hex');
    const group = new BuddyGroup({
      name,
      description,
      tags,
      privacy,
      creator,
      members: [creator],
      invitationLink,
    });
    await group.save();
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List buddy groups (with optional privacy filter)
exports.listBuddyGroups = async (req, res) => {
  try {
    const { privacy } = req.query;
    const filter = {};
    if (privacy) filter.privacy = privacy;
    const groups = await BuddyGroup.find(filter)
      .populate('creator', 'name')
      .select('-members -invitationLink');
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get buddy group details
exports.getBuddyGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await BuddyGroup.findById(groupId)
      .populate('creator', 'name')
      .populate('members', 'name profileImage');
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Join a buddy group (public or with invite)
exports.joinBuddyGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, invitationLink } = req.body;
    const group = await BuddyGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (
      group.privacy === 'private' &&
      group.invitationLink !== invitationLink
    ) {
      return res.status(403).json({ error: 'Invalid invitation link' });
    }
    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }
    res.json({ message: 'Joined group successfully', group });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Invite users to a private group (returns invitation link)
exports.inviteToBuddyGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await BuddyGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.privacy !== 'private') {
      return res
        .status(400)
        .json({ error: 'Invitations only for private groups' });
    }
    res.json({ invitationLink: group.invitationLink });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Request to join a buddy group (adds to pendingRequests)
exports.requestToJoinBuddyGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, message } = req.body;
    const group = await BuddyGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (group.members.includes(userId)) {
      return res.status(400).json({ error: 'Already a member' });
    }
    if (group.pendingRequests.some((r) => r.user.toString() === userId)) {
      return res.status(400).json({ error: 'Request already pending' });
    }
    group.pendingRequests.push({ user: userId, message });
    await group.save();
    res.json({ message: 'Join request submitted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// List all pending join requests for a group
exports.listBuddyGroupRequests = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await BuddyGroup.findById(groupId).populate(
      'pendingRequests.user',
      'name profileImage'
    );
    if (!group) return res.status(404).json({ error: 'Group not found' });
    res.json(group.pendingRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve a pending join request
exports.approveBuddyGroupRequest = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const group = await BuddyGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const requestIndex = group.pendingRequests.findIndex(
      (r) => r.user.toString() === userId
    );
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Request not found' });
    }
    // Add to members and remove from pending
    group.members.push(userId);
    group.pendingRequests.splice(requestIndex, 1);
    await group.save();
    res.json({ message: 'Request approved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Decline a pending join request
exports.declineBuddyGroupRequest = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const group = await BuddyGroup.findById(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    const requestIndex = group.pendingRequests.findIndex(
      (r) => r.user.toString() === userId
    );
    if (requestIndex === -1) {
      return res.status(404).json({ error: 'Request not found' });
    }
    group.pendingRequests.splice(requestIndex, 1);
    await group.save();
    res.json({ message: 'Request declined' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
