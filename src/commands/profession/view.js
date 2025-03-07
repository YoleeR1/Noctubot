const Discord = require('discord.js');

const professionSchema = require("../../database/models/economyProfessions");
const itemSchema = require("../../database/models/economyItems");

module.exports = async (client, interaction, args) => {
    // View current profession and stats
    const profData = await professionSchema.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
    
    if (!profData || profData.Profession === 'Unemployed') {
        return client.embed({
            title: `💼・Career Status`,
            desc: `You are currently unemployed! Use \`/profession choose\` to select a profession.`,
            fields: [
                {
                    name: `📊┆Experience`,
                    value: profData ? `${profData.Experience} XP` : `0 XP`,
                    inline: true
                },
                {
                    name: `🔄┆Total Jobs`,
                    value: profData ? `${profData.TotalWorked}` : `0`,
                    inline: true
                },
                {
                    name: `💰┆Total Earned`,
                    value: profData ? `$${profData.TotalEarned}` : `$0`,
                    inline: true
                }
            ],
            type: 'editreply'
        }, interaction);
    }
    
    // Format tier display
    let tierDisplay = "Beginner";
    if (profData.Tier === 2) tierDisplay = "Intermediate";
    if (profData.Tier === 3) tierDisplay = "Expert";
    
    // Calculate XP needed for next tier
    let nextTierXP = profData.Tier === 1 ? 500 : (profData.Tier === 2 ? 1000 : "Max Tier");
    let xpProgress = profData.Tier === 3 ? "100%" : `${Math.floor((profData.Experience / (profData.Tier === 1 ? 500 : 1000)) * 100)}%`;
    
    // Get required tool info
    const toolInfo = getProfessionTool(profData.Profession);
    const itemData = await itemSchema.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
    const hasTool = itemData ? itemData[toolInfo.itemField] === true : false;
    
    client.embed({
        title: `💼・Career Status`,
        desc: `Your current profession information`,
        fields: [
            {
                name: `👷‍♂️┆Profession`,
                value: profData.Profession,
                inline: true
            },
            {
                name: `🔰┆Tier`,
                value: `${tierDisplay} (Tier ${profData.Tier})`,
                inline: true
            },
            {
                name: `🛠️┆Required Tool`,
                value: `${toolInfo.name} (${hasTool ? "✅ Owned" : "❌ Not Owned"})`,
                inline: true
            },
            {
                name: `📊┆Experience`,
                value: `${profData.Experience} XP`,
                inline: true
            },
            {
                name: `📈┆Next Tier`,
                value: `${nextTierXP} XP (${xpProgress})`,
                inline: true
            },
            {
                name: `🔄┆Total Jobs`,
                value: `${profData.TotalWorked}`,
                inline: true
            },
            {
                name: `💰┆Total Earned`,
                value: `$${profData.TotalEarned}`,
                inline: true
            }
        ],
        type: 'editreply'
    }, interaction);
}

// Helper function to get tool info for a profession
function getProfessionTool(profession) {
    const tools = {
        'Fisherman': { name: 'Fishing Rod', itemField: 'FishingRod' },
        'Miner': { name: 'Pickaxe', itemField: 'PickAxe' },
        'Chef': { name: 'Spatula', itemField: 'Spatula' },
        'Programmer': { name: 'Laptop', itemField: 'Laptop' },
        'Doctor': { name: 'Med Kit', itemField: 'MedKit' },
        'Builder': { name: 'Hammer', itemField: 'Hammer' },
        'Unemployed': { name: 'None', itemField: null }
    };
    
    return tools[profession] || tools['Unemployed'];
}