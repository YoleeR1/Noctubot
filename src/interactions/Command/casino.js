const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('casino')
        .setDescription('Play the casino game')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the casino category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('blackjack')
                .setDescription('Play a blackjack game to win money')
                .addStringOption(option => option.setName('amount').setDescription('Enter amount (e.g. 100, 1K, 2.5M)').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('crash')
                .setDescription('More risk, more reward')
                .addStringOption(option => option.setName('amount').setDescription('Enter amount (e.g. 100, 1K, 2.5M)').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('roulette')
                .setDescription('Play roulette')
                .addStringOption(option => option.setName('color').setDescription('Enter a color').setRequired(true))
                .addStringOption(option => option.setName('amount').setDescription('Enter amount (e.g. 100, 1K, 2.5M)').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('slots')
                .setDescription('Play slots')
                .addStringOption(option => option.setName('amount').setDescription('Enter amount (e.g. 100, 1K, 2.5M)').setRequired(true))
        )
    ,

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

 