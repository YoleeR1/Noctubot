const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('family')
        .setDescription('Manage your family relationships')
        .addSubcommand(subcommand =>
            subcommand
                .setName('adopt')
                .setDescription('Adopt a user as your child')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disown')
                .setDescription('Disown one of your children')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('family')
                .setDescription('View someone\'s family relationships')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('propose')
                .setDescription('Propose marriage to a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the family category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete your entire family')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('divorce')
                .setDescription('Divorce your partner')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
        ),

    run: async (client, interaction, args) => {
        await interaction.deferReply({ fetchReply: true });
        client.loadSubcommands(client, interaction, args);
    },
};

