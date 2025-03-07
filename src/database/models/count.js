// File path: /src/database/models/count.js

const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    currentCount: { type: Number, default: 0 },
    highScore: { type: Number, default: 0 },
    lastUserId: { type: String, default: null },
    lastThreeUsers: { type: Array, default: [] }
});

module.exports = mongoose.model('Counting', Schema);
