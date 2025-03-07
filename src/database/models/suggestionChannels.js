const mongoose = require('mongoose');
const Schema = new mongoose.Schema({
    Guild: String,
    Channel: String,
    LogChannel: String,
    CooldownDuration: {
        type: Number,
        default: 86400000 // 24 hours in milliseconds
    }
});
module.exports = mongoose.model("suggestionChannels", Schema);
