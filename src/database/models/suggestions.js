const mongoose = require('mongoose');
const SuggestionSchema = new mongoose.Schema({
    Guild: String,
    MessageId: String,
    SuggestionId: String,
    Suggestion: String,
    Author: String,
    LastSuggestionTime: {
        type: Date,
        default: null
    }
});
module.exports = mongoose.model("suggestions", SuggestionSchema);
