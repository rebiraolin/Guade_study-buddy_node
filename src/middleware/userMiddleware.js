const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Blacklist = require('../models/Blacklist'); // Make sure the path to your Blacklist model is correct

const validateRegistration = [
    body('name').notEmpty().withMessage('Name is required.').trim(),
    body('username').notEmpty().withMessage('Username is required.').trim(),
    body('email')
        .notEmpty()
        .withMessage('Email is required.')
        .isEmail()
        .withMessage('Invalid email format.')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required.')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

const validateLogin = [
    body('email')
        .notEmpty()
        .withMessage('Email is required.')
        .isEmail()
        .withMessage('Invalid email format.')
        .normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
];

const isTokenBlacklisted = async (token) => {
    try {
        const tokenDoc = await Blacklist.findOne({ token });
        return !!tokenDoc;
    } catch (error) {
        console.error('Error checking blacklist:', error);
        return false; // Assume not blacklisted on error to avoid blocking requests unnecessarily, or handle differently based on your needs
    }
};

const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res
            .status(401)
            .json({ message: 'Token is required for authentication.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            console.error('JWT Verification Error:', err); // Log the error
            return res.status(403).json({ message: 'Token is invalid or expired.' });
        }

        console.log('Decoded Token Payload:', decoded); // Log the decoded payload

        try {
            const isBlacklisted = await isTokenBlacklisted(token);
            if (isBlacklisted) {
                return res.status(401).json({ message: 'Token has been revoked.' });
            }

            // --- ADJUST THIS PART BASED ON YOUR TOKEN PAYLOAD ---
            // Assuming your user ID is directly in the decoded object,
            // or under a key like 'id' or '_id'.
            // Adjust the key accordingly.

            if (decoded && decoded.userId) {
                req.user = { userId: decoded.userId };
            } else if (decoded && decoded.id) {
                req.user = { userId: decoded.id };
            } else if (decoded && decoded._id) {
                req.user = { userId: decoded._id };
            } else if (decoded && decoded.sub) { // 'sub' is often used for subject (user ID)
                req.user = { userId: decoded.sub };
            } else {
                console.error('User ID not found in JWT payload:', decoded);
                return res.status(403).json({ message: 'User identification not found in token.' });
            }
            // --- END OF ADJUSTMENT ---

            next();
        } catch (error) {
            console.error('Error during authentication:', error);
            return res
                .status(500)
                .json({ message: 'Internal server error during authentication.' });
        }
    });
};

module.exports = { validateRegistration, validateLogin, authenticate };