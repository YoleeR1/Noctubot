const Discord = require('discord.js');

const Schema = require("../../database/models/economy");
const ProfessionSchema = require("../../database/models/economyProfessions");
const { formatCurrency } = require("../../assets/utils/currencyFormatter");

module.exports = async (client, interaction, args) => {
    const type = interaction.options.getString("type");

    if (type == "money") {
        const rawLeaderboard = await Schema.find({ Guild: interaction.guild.id }).sort([['Money', 'descending']]);

        if (!rawLeaderboard.length) return client.errNormal({ 
            error: "No data found!",
            type: 'editreply'
        }, interaction);

        const lb = rawLeaderboard.map(e => `**${rawLeaderboard.findIndex(i => i.Guild === interaction.guild.id && i.User === e.User) + 1}** | <@!${e.User}> - ${client.emotes.economy.coins} \`$${formatCurrency(e.Money)}\``);

        await client.createLeaderboard(`🪙・Money - ${interaction.guild.name}`, lb, interaction);
    }
    else if (type == "bank") {
        const rawLeaderboard = await Schema.find({ Guild: interaction.guild.id }).sort([['Bank', 'descending']]);

        if (!rawLeaderboard.length) return client.errNormal({ 
            error: "No data found!",
            type: 'editreply'
        }, interaction);

        const lb = rawLeaderboard.map(e => `**${rawLeaderboard.findIndex(i => i.Guild === interaction.guild.id && i.User === e.User) + 1}** | <@!${e.User}> - ${client.emotes.economy.bank} \`$${formatCurrency(e.Bank)}\``);

        await client.createLeaderboard(`🏦・Bank - ${interaction.guild.name}`, lb, interaction);
    }
    else if (type == "profession") {
        // Get the profession type from the options
        const professionType = interaction.options.getString("profession") || "all";
        
        // Get all profession data for this guild
        let rawLeaderboard;
        
        if (professionType === "all") {
            // Get all professions sorted by tier and experience
            rawLeaderboard = await ProfessionSchema.find({ 
                Guild: interaction.guild.id,
                Profession: { $ne: "Unemployed" } // Exclude unemployed users
            }).sort([['Tier', 'descending'], ['Experience', 'descending']]);
            
            if (!rawLeaderboard.length) return client.errNormal({ 
                error: "No profession data found!",
                type: 'editreply'
            }, interaction);
            
            // Create a leaderboard with all professions
            const lb = rawLeaderboard.map(e => {
                const tierName = getTierName(e.Tier);
                return `**${rawLeaderboard.findIndex(i => i.Guild === interaction.guild.id && i.User === e.User) + 1}** | <@!${e.User}> - ${getProfessionEmoji(e.Profession)} ${e.Profession} (${tierName}) - XP: \`${e.Experience}\``;
            });
            
            await client.createLeaderboard(`👨‍💼・All Professions - ${interaction.guild.name}`, lb, interaction);
        } else {
            // Get specific profession sorted by tier and experience
            rawLeaderboard = await ProfessionSchema.find({ 
                Guild: interaction.guild.id,
                Profession: professionType
            }).sort([['Tier', 'descending'], ['Experience', 'descending']]);
            
            if (!rawLeaderboard.length) return client.errNormal({ 
                error: `No data found for ${professionType} profession!`,
                type: 'editreply'
            }, interaction);
            
            // Create a leaderboard for the specific profession
            const lb = rawLeaderboard.map(e => {
                const tierName = getTierName(e.Tier);
                return `**${rawLeaderboard.findIndex(i => i.Guild === interaction.guild.id && i.User === e.User && i.Profession === professionType) + 1}** | <@!${e.User}> - ${tierName} - XP: \`${e.Experience}\``;
            });
            
            await client.createLeaderboard(`${getProfessionEmoji(professionType)}・${professionType} - ${interaction.guild.name}`, lb, interaction);
        }
    }
}

// Helper function to get tier name
function getTierName(tier) {
    switch(tier) {
        case 1: return "Beginner";
        case 2: return "Intermediate";
        case 3: return "Expert";
        default: return "Unknown";
    }
}

// Helper function to get profession emoji
function getProfessionEmoji(profession) {
    switch(profession) {
        case "Fisherman": return "🎣";
        case "Miner": return "⛏️";
        case "Chef": return "👨‍🍳";
        case "Programmer": return "💻";
        case "Doctor": return "👨‍⚕️";
        case "Builder": return "👷";
        default: return "👨‍💼";
    }
}