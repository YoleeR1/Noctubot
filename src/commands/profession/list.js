const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    // Show all professions and their stats
    client.embed({
        title: `💼・Available Professions`,
        desc: `Here are all available professions and their details:`,
        fields: [
            {
                name: `🎣┆Fisherman`,
                value: `Required Tool: Fishing Rod\nEarnings: $10-100\nBest for: Steady, low-risk income`,
                inline: true
            },
            {
                name: `⛏️┆Miner`,
                value: `Required Tool: Pickaxe\nEarnings: $20-120\nBest for: Medium earnings with occasional bonuses`,
                inline: true
            },
            {
                name: `👨‍🍳┆Chef`,
                value: `Required Tool: Spatula\nEarnings: $15-110\nBest for: Balanced earnings and experience gain`,
                inline: true
            },
            {
                name: `💻┆Programmer`,
                value: `Required Tool: Laptop\nEarnings: $25-150\nBest for: High earnings but expensive tools`,
                inline: true
            },
            {
                name: `👨‍⚕️┆Doctor`,
                value: `Required Tool: Med Kit\nEarnings: $30-200\nBest for: Highest potential earnings`,
                inline: true
            },
            {
                name: `👷┆Builder`,
                value: `Required Tool: Hammer\nEarnings: $20-130\nBest for: Reliable medium-high earnings`,
                inline: true
            },
            {
                name: `📈┆Progression System`,
                value: `Each profession has 3 tiers:\n- Beginner: Base earnings\n- Intermediate (500 XP): 25% bonus\n- Expert (1000 XP): 50% bonus`,
                inline: false
            }
        ],
        type: 'editreply'
    }, interaction);
}