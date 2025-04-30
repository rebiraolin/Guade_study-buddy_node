// File: src/controllers/postController.js
const Post = require('../models/Post');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const user = req.user;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const newPost = new Post({
      user: user.id,
      content,
    });

    const savedPost = await newPost.save();

    res.status(201).json(savedPost);
  } catch (error) {
    console.error('Create Post Error:', error);
    res
      .status(500)
      .json({ message: 'Error creating post', error: error.message });
  }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name avatar profilePic')
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error('Get Posts Error:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

// @desc    Get a single post by ID
// @route   GET /api/posts/:id
// @access  Public
exports.getPostById = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Post ID' });
    }
    const post = await Post.findById(id).populate(
      'user',
      'name avatar profilePic'
    );
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(200).json(post);
  } catch (error) {
    console.error('Get Post by ID Error', error);
    res
      .status(500)
      .json({ message: 'Error fetching post', error: error.message });
  }
};

// @desc    Update a post by ID
// @route   PUT /api/posts/:id
// @access  Private (requires ownership)
exports.updatePost = async (req, res) => {
  try {
    const { content } = req.body;
    const post = req.post;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    post.content = content;
    const updatedPost = await post.save();
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error('Update Post Error:', error);
    res.status(500).json({ message: 'Error updating post' });
  }
};

// @desc    Delete a post by ID
// @route   DELETE /api/posts/:id
// @access  Private (requires ownership)
exports.deletePost = async (req, res) => {
  try {
    const post = req.post;
    await post.deleteOne();
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete Post Error:', error);
    res.status(500).json({ message: 'Error deleting post' });
  }
};

// @desc    Like/Unlike a post
// @route   PUT /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user has already liked the post
    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
      await post.save();
      res
        .status(200)
        .json({ message: 'Post unliked', likes: post.likes.length });
    } else {
      post.likes.push(userId);
      await post.save();
      res.status(200).json({ message: 'Post liked', likes: post.likes.length });
    }
  } catch (error) {
    console.error('Like Post Error:', error);
    res.status(500).json({ message: 'Error liking/unliking post' });
  }
};


// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const newComment = {
            user: userId,
            text,
            createdAt: new Date(),
        };

        post.comments.push(newComment);
        await post.save();

        const populatedPost = await Post.findById(postId).populate('comments.user', 'name avatar profilePic');
        const lastComment = populatedPost.comments[populatedPost.comments.length - 1];
        res.status(201).json(lastComment);
    } catch (error) {
        console.error("Add Comment Error:", error);
        res.status(500).json({ message: 'Error adding comment' });
    }
};

// @desc    Delete a comment from a post
// @route   DELETE /api/posts/:post_id/comments/:comment_id
// @access  Private (Comment owner or Post owner)
exports.deleteComment = async (req, res) => {
    try {
        const { post_id, comment_id } = req.params;
        const userId = req.user.id;

        const post = await Post.findById(post_id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const commentIndex = post.comments.findIndex(
            (comment) => comment._id.toString() === comment_id
        );

        if (commentIndex === -1) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const comment = post.comments[commentIndex];

        if (comment.user.toString() !== userId && post.user.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        post.comments.splice(commentIndex, 1);
        await post.save();

        res.status(200).json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error("Delete Comment Error:", error);
        res.status(500).json({ message: 'Error deleting comment' });
    }
};

// @desc    Save/Unsave a post
// @route   PUT /api/posts/:id/save
// @access  Private
exports.savePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.savedPosts.includes(postId)) {
            user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
            await user.save();
            res.status(200).json({ message: 'Post unsaved' });
        } else {
            user.savedPosts.push(postId);
            await user.save();
            res.status(200).json({ message: 'Post saved' });
        }
    } catch (error) {
        console.error("Save Post Error:", error);
        res.status(500).json({ message: 'Error saving/unsaving post' });
    }
};

// @desc    Increment share count for a post
// @route   PUT /api/posts/:id/share
// @access  Private
exports.sharePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        post.shares = (post.shares || 0) + 1;
        await post.save();

        res.status(200).json({ message: 'Post shared successfully', shares: post.shares });
    } catch (error) {
        console.error("Share Post Error:", error);
        res.status(500).json({ message: 'Error sharing post' });
    }
};
