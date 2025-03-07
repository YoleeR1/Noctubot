const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    User: String,
    // Tools and equipment
    FishingRod: { type: Boolean, default: false },
    FishingRodUsage: { type: Number, default: 0 },
    FishingRodTier: { type: Number, default: 1 },
    
    PickAxe: { type: Boolean, default: false },
    PickAxeUsage: { type: Number, default: 0 },
    PickAxeTier: { type: Number, default: 1 },
    
    Laptop: { type: Boolean, default: false },
    LaptopUsage: { type: Number, default: 0 },
    LaptopTier: { type: Number, default: 1 },
    
    Spatula: { type: Boolean, default: false },
    SpatulaUsage: { type: Number, default: 0 },
    SpatulaTier: { type: Number, default: 1 },
    
    MedKit: { type: Boolean, default: false },
    MedKitUsage: { type: Number, default: 0 },
    MedKitTier: { type: Number, default: 1 },
    
    Hammer: { type: Boolean, default: false },
    HammerUsage: { type: Number, default: 0 },
    HammerTier: { type: Number, default: 1 },
    
    // Inventory items
    Inventory: {
        type: Map,
        of: Number,
        default: new Map()
    }
});

module.exports = mongoose.model("economyItems", Schema);