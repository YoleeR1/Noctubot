const Discord = require('discord.js');

const professionSchema = require("../../database/models/economyProfessions");
const itemSchema = require("../../database/models/economyItems");

module.exports = async (client, interaction, args) => {
    // Create selection menu for professions
    const row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.StringSelectMenuBuilder()
                .setCustomId('profession_select')
                .setPlaceholder('Select a profession')
                .addOptions([
                    {
                        label: 'Fisherman',
                        description: 'Catch and sell fish for profit',
                        value: 'Fisherman',
                        emoji: '🎣',
                    },
                    {
                        label: 'Miner',
                        description: 'Extract valuable minerals from the earth',
                        value: 'Miner',
                        emoji: '⛏️',
                    },
                    {
                        label: 'Chef',
                        description: 'Cook delicious meals for hungry customers',
                        value: 'Chef',
                        emoji: '👨‍🍳',
                    },
                    {
                        label: 'Programmer',
                        description: 'Develop software and solve technical problems',
                        value: 'Programmer',
                        emoji: '💻',
                    },
                    {
                        label: 'Doctor',
                        description: 'Treat patients and save lives',
                        value: 'Doctor',
                        emoji: '👨‍⚕️',
                    },
                    {
                        label: 'Builder',
                        description: 'Construct buildings and infrastructure',
                        value: 'Builder',
                        emoji: '👷',
                    },
                ]),
        );
        
    // Display profession selection menu
    client.embed({
        title: `💼・Choose a Profession`,
        desc: `Select a profession from the menu below. Each profession requires a specific tool and offers different earnings.`,
        fields: [
            {
                name: `🎣┆Fisherman`,
                value: `Required Tool: Fishing Rod\nEarnings: $10-100`,
                inline: true
            },
            {
                name: `⛏️┆Miner`,
                value: `Required Tool: Pickaxe\nEarnings: $20-120`,
                inline: true
            },
            {
                name: `👨‍🍳┆Chef`,
                value: `Required Tool: Spatula\nEarnings: $15-110`,
                inline: true
            },
            {
                name: `💻┆Programmer`,
                value: `Required Tool: Laptop\nEarnings: $25-150`,
                inline: true
            },
            {
                name: `👨‍⚕️┆Doctor`,
                value: `Required Tool: Med Kit\nEarnings: $30-200`,
                inline: true
            },
            {
                name: `👷┆Builder`,
                value: `Required Tool: Hammer\nEarnings: $20-130`,
                inline: true
            },
            {
                name: `📈┆Progression`,
                value: `Each profession has 3 tiers: Beginner, Intermediate, and Expert. Higher tiers earn more money!`,
                inline: false
            }
        ],
        components: [row],
        type: 'editreply'
    }, interaction);
    
    // Handle selection menu interaction
    const filter = i => i.user.id === interaction.user.id;
    interaction.channel.awaitMessageComponent({ filter, time: 60000 })
        .then(async i => {
            const selectedProfession = i.values[0];
            
            // Update user's profession
            await client.chooseProfession(interaction, interaction.user, selectedProfession);
            
            // Get tool info for the selected profession
            const toolInfo = getProfessionTool(selectedProfession);
            
            client.embed({
                title: `💼・Profession Selected`,
                desc: `You are now a ${selectedProfession}!`,
                fields: [
                    {
                        name: `🛠️┆Required Tool`,
                        value: `You need a ${toolInfo.name} to work as a ${selectedProfession}. Visit the store to buy one!`,
                        inline: false
                    },
                    {
                        name: `💰┆Earnings`,
                        value: `As you gain experience and advance tiers, you'll earn more money!`,
                        inline: false
                    }
                ],
                type: 'update',
                components: []
            }, i);
        })
        .catch(err => {
            interaction.editReply({ 
                content: 'Profession selection timed out or failed.', 
                components: [] 
            });
        });
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