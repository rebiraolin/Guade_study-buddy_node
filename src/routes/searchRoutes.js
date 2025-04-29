const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Advanced search with multiple filters
router.get('/advanced', searchController.advancedSearch);

// Text search
router.get('/text', searchController.textSearch);

// Get sessions by subject
router.get('/subject/:subject', searchController.getSessionsBySubject);

// Get sessions by course code
router.get('/course/:courseCode', searchController.getSessionsByCourse);

// Get sessions by date range
router.get('/date-range', searchController.getSessionsByDateRange);

// Get sessions with available spots
router.get('/available-spots', searchController.getSessionsWithSpots);

module.exports = router; 