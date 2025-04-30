const Message = require('../models/Message');
const mongoose = require('mongoose');

exports.getMessages = async (req, res) => {
  const { recipientId } = req.query;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(recipientId)) {
    return res.status(400).json({ message: 'Invalid recipient ID format' });
  }

  try {
    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: recipientId },
        { sender: recipientId, recipient: userId },
      ],
    })
      .sort({ timestamp: 1 })
      .populate('sender', 'name avatar profilePic') // Populate profilePic here too
      .populate('recipient', 'name avatar profilePic'); // Populate profilePic here too

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};
