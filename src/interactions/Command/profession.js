const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profession')
        .setDescription('Manage your career and profession in the economy system')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View your current profession and stats')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('choose')
                .setDescription('Choose a new profession')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all available professions and their details')
        ),

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ withResponse: true });
        client.loadSubcommands(client, interaction, args);
    },
};