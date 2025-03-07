const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    
    // Role items (keeping backward compatibility)
    Role: { type: String, default: null },
    
    // Item properties
    ItemName: { type: String, default: null },
    ItemType: { 
        type: String, 
        enum: ['role', 'tool', 'consumable', 'collectible', 'special'],
        default: 'role'
    },
    ItemDescription: { type: String, default: "No description available" },
    
    // Price and requirements
    Amount: { type: Number, required: true },
    BaseAmount: { type: Number, default: function() { return this.Amount; } }, // Original price before inflation
    
    // Requirements
    RequiredProfession: { type: String, default: null },
    RequiredTier: { type: Number, default: 0 },
    
    // Item properties for tools
    ToolTier: { type: Number, default: 1 },
    MaxUses: { type: Number, default: 50 },
    
    // For consumables
    Effect: { type: String, default: null },
    EffectAmount: { type: Number, default: 0 }
});

module.exports = mongoose.model("economyStore", Schema);