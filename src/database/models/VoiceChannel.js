const mongoose = require('mongoose');

const VoiceChannelSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    ownerId: { type: String, required: true },
    locked: { type: Boolean, default: false },
    whitelist: { type: [String], default: [] },
    blacklist: { type: [String], default: [] },
});

module.exports = mongoose.model('VoiceChannel', VoiceChannelSchema);
