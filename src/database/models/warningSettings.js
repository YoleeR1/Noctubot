const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    WarningsChannel: String,
    MaxWarnings: { type: Number, default: 3 },
    WarningExpiryDays: { type: Number, default: 90 }
});

module.exports = mongoose.model("warningSettings", Schema);