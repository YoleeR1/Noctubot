const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    User: String,
    Partner: String,
    Parent: [String], // Parents of the user
    Children: [String], // Children directly associated with this user
    SharedChildren: [String], // Children shared with a partner
});

module.exports = mongoose.model("family", Schema);