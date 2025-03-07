const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    Guild: String,
    
    // Total money in circulation
    TotalMoney: { type: Number, default: 0 },
    TotalBank: { type: Number, default: 0 },
    
    // Inflation metrics
    InflationRate: { type: Number, default: 0 }, // Percentage increase in prices
    InflationThreshold: { type: Number, default: 25000 }, // Money threshold before inflation kicks in
    
    // Economy statistics
    TotalTransactions: { type: Number, default: 0 },
    TotalItemsPurchased: { type: Number, default: 0 },
    
    // Timestamp for last update
    LastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("economyStats", Schema);