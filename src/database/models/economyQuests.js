const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    User: String,
    DailyQuests: [{
        ID: String,
        Name: String,
        Description: String,
        MoneyReward: Number,
        XPReward: Number,
        Completed: Boolean
    }],
    ProfessionQuests: [{
        ID: String,
        Name: String,
        Description: String,
        MoneyReward: Number,
        XPReward: Number,
        Completed: Boolean
    }],
    LastDailyRefresh: Date
});

module.exports = mongoose.model("economyQuests", Schema);