const Discord = require('discord.js');

const Schema = require("../../database/models/economy");
const itemSchema = require("../../database/models/economyItems");
const professionSchema = require("../../database/models/economyProfessions");

module.exports = async (client, interaction, args) => {
    // Get user's money data
    const data = await Schema.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
    if (!data) {
        return client.errNormal({
            error: `You don't have any money yet! Try working first.`,
            type: 'editreply'
        }, interaction);
    }
    
    // Get user's items
    const itemData = await itemSchema.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
    if (!itemData) {
        return client.errNormal({
            error: `You don't own any tools to upgrade!`,
            type: 'editreply'
        }, interaction);
    }
    
    // Get user's profession data
    const profData = await professionSchema.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
    const userProfession = profData ? profData.Profession : 'Unemployed';
    const userTier = profData ? profData.Tier : 1;
    
    // Get the tool to upgrade
    const toolOption = interaction.options.getString('tool');
    
    // Map tool option to actual tool data
    const toolMap = {
        'fishingrod': { 
            name: 'Fishing Rod', 
            field: 'FishingRod', 
            tierField: 'FishingRodTier', 
            usageField: 'FishingRodUsage',
            profession: 'Fisherman'
        },
        'pickaxe': { 
            name: 'Pickaxe', 
            field: 'PickAxe', 
            tierField: 'PickAxeTier', 
            usageField: 'PickAxeUsage',
            profession: 'Miner'
        },
        'spatula': { 
            name: 'Spatula', 
            field: 'Spatula', 
            tierField: 'SpatulaTier', 
            usageField: 'SpatulaUsage',
            profession: 'Chef'
        },
        'laptop': { 
            name: 'Laptop', 
            field: 'Laptop', 
            tierField: 'LaptopTier', 
            usageField: 'LaptopUsage',
            profession: 'Programmer'
        },
        'medkit': { 
            name: 'Med Kit', 
            field: 'MedKit', 
            tierField: 'MedKitTier', 
            usageField: 'MedKitUsage',
            profession: 'Doctor'
        },
        'hammer': { 
            name: 'Hammer', 
            field: 'Hammer', 
            tierField: 'HammerTier', 
            usageField: 'HammerUsage',
            profession: 'Builder'
        }
    };
    
    const tool = toolMap[toolOption.toLowerCase()];
    if (!tool) {
        return client.errNormal({
            error: `Invalid tool specified. Available tools: fishingrod, pickaxe, spatula, laptop, medkit, hammer`,
            type: 'editreply'
        }, interaction);
    }
    
    // Check if user owns the tool
    if (!itemData[tool.field]) {
        return client.errNormal({
            error: `You don't own a ${tool.name}! Buy one from the store first.`,
            type: 'editreply'
        }, interaction);
    }
    
    // Get current tier
    const currentTier = itemData[tool.tierField] || 1;
    
    // Check if already at max tier
    if (currentTier >= 3) {
        return client.errNormal({
            error: `Your ${tool.name} is already at maximum tier (Tier 3)!`,
            type: 'editreply'
        }, interaction);
    }
    
    // Calculate upgrade cost based on current tier
    const baseCost = getBaseToolCost(tool.name);
    const upgradeCost = Math.floor(baseCost * (currentTier + 1) * 1.5);
    
    // Check if user has enough money
    if (data.Money < upgradeCost) {
        return client.errNormal({
            error: `You don't have enough money to upgrade this tool! You need ${client.emotes.economy.coins} $${upgradeCost - data.Money} more.`,
            type: 'editreply'
        }, interaction);
    }
    
    // Check profession tier requirement
    const requiredUserTier = currentTier + 1 - 1; // Tier 2 tool requires Tier 1 profession, Tier 3 tool requires Tier 2 profession
    if (userTier < requiredUserTier) {
        return client.errNormal({
            error: `You need to be at least ${getTierName(requiredUserTier)} tier in your profession to upgrade to a Tier ${currentTier + 1} tool!`,
            type: 'editreply'
        }, interaction);
    }
    
    // Perform the upgrade
    itemData[tool.tierField] = currentTier + 1;
    itemData[tool.usageField] = 0; // Reset usage counter after upgrade
    await itemData.save();
    
    // Remove money
    client.removeMoney(interaction, interaction.user, upgradeCost);
    
    // Calculate new durability
    const newDurability = 15 + (itemData[tool.tierField] * 10);
    
    // Success message
    client.succNormal({
        text: `Tool upgrade successful!`,
        fields: [
            {
                name: `🛠️┆Tool`,
                value: tool.name,
                inline: true
            },
            {
                name: `📈┆New Tier`,
                value: `Tier ${currentTier + 1}`,
                inline: true
            },
            {
                name: `${client.emotes.economy.coins}┆Cost`,
                value: `$${upgradeCost}`,
                inline: true
            },
            {
                name: `⚒️┆Durability`,
                value: `${newDurability} uses`,
                inline: true
            },
            {
                name: `💰┆Earnings Bonus`,
                value: `+${(currentTier + 1) * 10}%`,
                inline: true
            }
        ],
        type: 'editreply'
    }, interaction);
    
    // Special message if tool matches profession
    if (userProfession === tool.profession) {
        client.embed({
            title: `🔧・Professional Upgrade`,
            desc: `You've upgraded your professional tool!`,
            fields: [
                {
                    name: `💼┆Profession`,
                    value: userProfession,
                    inline: true
                },
                {
                    name: `🛠️┆Tool`,
                    value: `Tier ${currentTier + 1} ${tool.name}`,
                    inline: true
                },
                {
                    name: `💰┆Benefit`,
                    value: `Your upgraded tool will last longer and provide better earnings!`,
                    inline: false
                }
            ],
            color: client.config.colors.success,
            type: 'reply'
        }, interaction);
    }
}

// Helper function to get base tool cost
function getBaseToolCost(toolName) {
    const costs = {
        'Fishing Rod': 100,
        'Pickaxe': 150,
        'Spatula': 120,
        'Laptop': 200,
        'Med Kit': 250,
        'Hammer': 130
    };
    
    return costs[toolName] || 100;
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