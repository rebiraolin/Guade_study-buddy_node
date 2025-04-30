const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');
const Post = require('../models/Post');

// --- Helper Middleware ---
const findPostAndVerifyOwnership = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to perform this action' });
    }
    req.post = post;
    next();
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found (invalid ID)' });
    }
    console.error('Error in findPostAndVerifyOwnership:', error);
    res.status(500).json({ message: 'Error finding post' });
  }
};

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', authMiddleware, postController.createPost);

// @route   GET /api/posts
// @desc    Get all posts
// @access  Public
router.get('/', postController.getPosts);

// @route   GET /api/posts/:id
// @desc    Get a single post by ID
// @access  Public
router.get('/:id', postController.getPostById);

// @route   PUT /api/posts/:id
// @desc    Update a post by ID
// @access  Private (requires authentication and ownership)
router.put(
  '/:id',
  authMiddleware,
  findPostAndVerifyOwnership,
  postController.updatePost
);

// @route   DELETE /api/posts/:id
// @desc    Delete a post by ID
// @access  Private (requires authentication and ownership)
router.delete(
  '/:id',
  authMiddleware,
  findPostAndVerifyOwnership,
  postController.deletePost
);

// --- Routes for Like, Comment, Share, Save Actions ---

// @route   PUT /api/posts/:id/like
// @desc    Like/Unlike a post
// @access  Private
router.put('/:id/like', authMiddleware, postController.likePost);

// @route   POST /api/posts/:id/comments
// @desc    Add a comment to a post
// @access  Private
router.post('/:id/comments', authMiddleware, postController.addComment);

// @route   DELETE /api/posts/:post_id/comments/:comment_id
// @desc    Delete a comment from a post
// @access  Private (Comment owner or Post owner)
router.delete(
  '/:post_id/comments/:comment_id',
  authMiddleware,
  postController.deleteComment
);

// @route   PUT /api/posts/:id/save
// @desc    Save/Unsave a post
// @access  Private
router.put('/:id/save', authMiddleware, postController.savePost);

// @route   PUT /api/posts/:id/share
// @desc    Increment share count for a post
// @access  Private
router.put('/:id/share', authMiddleware, postController.sharePost);

module.exports = router;
