const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggestions')
        .setDescription('Manage the server suggestions system')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Set up the suggestions channel')
                .addChannelOption(option => 
                    option.setName('channel')
                        .setDescription('The channel for suggestions')
                        .setRequired(true))
                .addChannelOption(option => 
                    option.setName('logs')
                        .setDescription('The channel for suggestion logs')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('suggest')
                .setDescription('Create a new suggestion')
                .addStringOption(option => 
                    option.setName('suggestion')
                        .setDescription('Your suggestion')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit your suggestion')
                .addStringOption(option => 
                    option.setName('id')
                        .setDescription('The suggestion ID')
                        .setRequired(true))
                .addStringOption(option => 
                    option.setName('new_suggestion')
                        .setDescription('Your updated suggestion')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove your suggestion')
                .addStringOption(option => 
                    option.setName('id')
                        .setDescription('The suggestion ID')
                        .setRequired(true))
        ),

    run: async (client, interaction, args) => {
        await interaction.deferReply({ fetchReply: true });
        client.loadSubcommands(client, interaction, args);
    },
};
