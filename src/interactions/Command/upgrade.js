const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('upgrade')
        .setDescription('Upgrade your tools to higher tiers')
        .addStringOption(option =>
            option.setName('tool')
                .setDescription('The tool you want to upgrade')
                .setRequired(true)
                .addChoices(
                    {name: 'Fishing Rod', value: 'fishingrod'},
                    {name: 'Pickaxe', value: 'pickaxe'},
                    {name: 'Spatula', value: 'spatula'},
                    {name: 'Laptop', value: 'laptop'},
                    {name: 'Med Kit', value: 'medkit'},
                    {name: 'Hammer', value: 'hammer'}
                )
        ),

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ withResponse: true });
        // Load the upgrade command directly from the economy directory
        const upgradeCommand = require('../../commands/economy/upgrade.js');
        await upgradeCommand(client, interaction, args);
    },
};