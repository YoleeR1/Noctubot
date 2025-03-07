const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    Words: [{
        original: String,
        variations: [String]
    }]
});

module.exports = mongoose.model("blacklist-words", Schema);
