const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
  token: { type: String, required: true },
  expires: { type: Date, required: true },
  userId: { type: String },
  ipAddress: { type: String },
});

module.exports = mongoose.model('Blacklist', blacklistSchema);
