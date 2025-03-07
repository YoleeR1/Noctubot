const mongoose = require('mongoose');

// Rules Schema - defines individual rule configuration
const ruleSchema = new mongoose.Schema({
    type: { 
        type: String, 
        required: true,
        enum: [
            'spam', 
            'invite', 
            'links', 
            'words', 
            'mentions', 
            'capitals', 
            'raids',
            'attachments',
            'stickers',
            'custom'
        ]
    },
    enabled: { 
        type: Boolean, 
        default: true 
    },
    // Settings specific to each rule type
    settings: {
        // Spam settings
        messageLimit: { type: Number, default: 5 },  // Max messages in timeFrame
        timeFrame: { type: Number, default: 10000 }, // Time window in ms
        duplicateLimit: { type: Number, default: 3 }, // Identical message threshold

        // Word filter settings
        words: [String],                 // Blacklisted words or phrases
        regexPatterns: [String],         // Regex patterns for custom filtering
        checkDisplayName: { type: Boolean, default: false }, // Check nicknames and usernames
        
        // Link settings
        allowedLinks: [String],          // Whitelisted domains
        allowedImageLinks: { type: Boolean, default: true }, // Allow image links

        // Mention settings
        maxMentions: { type: Number, default: 5 }, // Max mentions per message
        maxRoleMentions: { type: Number, default: 3 }, // Max role mentions per message
        
        // Capitals settings
        capsPercentage: { type: Number, default: 70 }, // % of caps allowed
        minLength: { type: Number, default: 8 },       // Min message length to check

        // Custom rules (for future expansion)
        customRegex: { type: String, default: null },   // Custom regex pattern
        customLogic: { type: String, default: null }    // Custom logic description
    },
    actions: [{
        type: { 
            type: String, 
            required: true,
            enum: ['delete', 'warn', 'timeout', 'kick', 'ban', 'log'] 
        },
        duration: { type: Number, default: 0 }, // Duration in ms for timeout/ban
        reason: { type: String, default: 'Automod violation' },
        // If multiple violations occur within this time, escalate to next action
        escalationTimeout: { type: Number, default: 3600000 } // 1 hour in ms
    }],
    // Exemptions from this rule
    exemptRoles: [String],
    exemptChannels: [String],
    exemptUsers: [String]
});

// Main Automod Schema
const Schema = new mongoose.Schema({
    Guild: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    logChannel: { type: String, default: null },
    warnUsers: { type: Boolean, default: true },   // Send warning messages to users
    deleteWarnings: { type: Boolean, default: true }, // Delete warning messages after x seconds
    warningTimeout: { type: Number, default: 5000 }, // How long warnings stay (5 seconds)
    rules: [ruleSchema],
    recentOffenders: {
        type: Map,
        of: Object, // { userId: { violations: [timestamps], lastEscalation: timestamp }}
        default: new Map()
    }
});

module.exports = mongoose.model("automod", Schema);