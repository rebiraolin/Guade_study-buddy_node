const StudySession = require('../models/StudySession');
const OneOnOneSession = require('../models/OneOnOneSession');
const GroupSession = require('../models/GroupSession');
const QuickSession = require('../models/QuickSession');

// Advanced search with multiple filters
exports.advancedSearch = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      subject,
      courseCode,
      status = 'active',
      sessionType,
      startDate,
      endDate,
      minDuration,
      maxDuration,
      location,
      hasSpots,
      search,
      sortBy = 'dateTime',
      sortOrder = 'asc'
    } = req.query;

    // Build filters object
    const filters = {
      subject,
      courseCode,
      status,
      sessionType,
      startDate,
      endDate,
      minDuration: minDuration ? parseInt(minDuration) : undefined,
      maxDuration: maxDuration ? parseInt(maxDuration) : undefined,
      location,
      hasSpots: hasSpots === 'true',
      search
    };

    // Determine sort direction
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    filters.sortBy = sortOptions;

    // Execute search
    const sessions = await StudySession.advancedSearch(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    // Get total count for pagination
    const count = await StudySession.countDocuments(filters);

    res.json({
      sessions,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalResults: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search by text query
exports.textSearch = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchResults = await StudySession.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
      .populate('creator', 'name email')
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .exec();

    const count = await StudySession.countDocuments({ $text: { $search: query } });

    res.json({
      results: searchResults,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalResults: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get sessions by subject
exports.getSessionsBySubject = async (req, res) => {
  try {
    const { subject, page = 1, limit = 10 } = req.params;

    const sessions = await StudySession.find({ subject })
      .populate('creator', 'name email')
      .sort({ dateTime: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .exec();

    const count = await StudySession.countDocuments({ subject });

    res.json({
      sessions,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalResults: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get sessions by course code
exports.getSessionsByCourse = async (req, res) => {
  try {
    const { courseCode, page = 1, limit = 10 } = req.params;

    const sessions = await StudySession.find({ courseCode })
      .populate('creator', 'name email')
      .sort({ dateTime: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .exec();

    const count = await StudySession.countDocuments({ courseCode });

    res.json({
      sessions,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalResults: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get sessions by date range
exports.getSessionsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Both startDate and endDate are required' });
    }

    const sessions = await StudySession.find({
      dateTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
      .populate('creator', 'name email')
      .sort({ dateTime: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .exec();

    const count = await StudySession.countDocuments({
      dateTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });

    res.json({
      sessions,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalResults: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get sessions with available spots
exports.getSessionsWithSpots = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const sessions = await StudySession.find({
      currentParticipants: { $lt: mongoose.model('StudySession').maxParticipants },
      status: 'active'
    })
      .populate('creator', 'name email')
      .sort({ dateTime: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .exec();

    const count = await StudySession.countDocuments({
      currentParticipants: { $lt: mongoose.model('StudySession').maxParticipants },
      status: 'active'
    });

    res.json({
      sessions,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalResults: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 