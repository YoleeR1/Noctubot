const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    TrialModRole: String,
    ModeratorRole: String,
    SpecialAccessRole: String
});

module.exports = mongoose.model("modRoles", Schema);