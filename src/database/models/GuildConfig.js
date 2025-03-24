const mongoose = require('mongoose');

const GuildConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    joinToCreateChannelId: { type: String },
});

module.exports = mongoose.model('GuildConfig', GuildConfigSchema);
