// File: src/models/Message.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true, // Optional: adds createdAt and updatedAt fields
  }
);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; // Export the Message model
