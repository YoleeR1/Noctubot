const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    User: String,
    
    // Current profession
    Profession: { 
        type: String, 
        enum: ['Unemployed', 'Fisherman', 'Miner', 'Chef', 'Programmer', 'Doctor', 'Builder'],
        default: 'Unemployed'
    },
    
    // Experience and progression
    Experience: { type: Number, default: 0 },
    Tier: { type: Number, default: 1 }, // 1: Beginner, 2: Intermediate, 3: Expert
    
    // Work statistics
    TotalWorked: { type: Number, default: 0 },
    TotalEarned: { type: Number, default: 0 },
    
    // Profession history - tracks experience in all professions
    ProfessionExperience: {
        Fisherman: { type: Number, default: 0 },
        Miner: { type: Number, default: 0 },
        Chef: { type: Number, default: 0 },
        Programmer: { type: Number, default: 0 },
        Doctor: { type: Number, default: 0 },
        Builder: { type: Number, default: 0 }
    }
});

module.exports = mongoose.model("economyProfessions", Schema);