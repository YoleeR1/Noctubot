const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy')
        .setDescription('Play the economy game in your server')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the economy category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('additem')
                .setDescription('Add a role item to the economy store')
                .addRoleOption(option => option.setName('role').setDescription('Select a role').setRequired(true))
                .addStringOption(option => option.setName('amount').setDescription('Enter amount (e.g. 100, 1K, 2.5M)').setRequired(true))

        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('addmoney')
                .setDescription('Add money to a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addStringOption(option => option.setName('amount').setDescription('Enter amount (e.g. 100, 1K, 2.5M)').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('balance')
                .setDescription('See your balance')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('beg')
                .setDescription('Beg for money')
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('buy')
                .setDescription('Buy items in the Bot store')
                .addStringOption(option => 
                    option.setName('item')
                        .setDescription('The item or role ID you want to buy')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear the economy')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('crime')
                .setDescription('Commit a crime')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('Claim your time-based rewards')
                .addStringOption(option =>
                    option.setName('period')
                        .setDescription('Which time period reward to claim')
                        .setRequired(true)
                        .addChoices(
                            {name: 'Hourly', value: 'hourly'},
                            {name: 'Daily', value: 'daily'},
                            {name: 'Weekly', value: 'weekly'},
                            {name: 'Monthly', value: 'monthly'},
                            {name: 'Yearly', value: 'yearly'}
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('deleteitem')
                .setDescription('Delete a role item from the economy store')
                .addRoleOption(option => option.setName('role').setDescription('Select a role').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('bank')
                .setDescription('Manage your bank account')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('What you want to do with your bank account')
                        .setRequired(true)
                        .addChoices(
                            {name: 'Deposit money', value: 'deposit'},
                            {name: 'Withdraw money', value: 'withdraw'}
                        )
                )
                .addStringOption(option => option.setName('amount').setDescription('Enter amount (e.g. 100, 1K, 2.5M)').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('fish')
                .setDescription('Fish some fish')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('hunt')
                .setDescription('Hunt some animals')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('pay')
                .setDescription('Pay a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addStringOption(option => option.setName('amount').setDescription('Enter amount (e.g. 100, 1K, 2.5M)').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('present')
                .setDescription('Get a weekly present')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('removemoney')
                .setDescription('Remove money from a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addStringOption(option => option.setName('amount').setDescription('Enter amount (e.g. 100, 1K, 2.5M)').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('rob')
                .setDescription('Rob a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('store')
                .setDescription('Show the store of this guild')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('work')
                .setDescription('Go to work')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('See the economy leaderboard')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The leaderboard type that you want')
                        .setRequired(true)
                        .addChoices(
                            {name: 'Money', value: 'money'},
                            {name: 'Bank', value: 'bank'},
                            {name: 'Profession', value: 'profession'}
                        )
                )
                .addStringOption(option =>
                    option.setName('profession')
                        .setDescription('Which profession to show (only for profession type)')
                        .setRequired(false)
                        .addChoices(
                            {name: 'All Professions', value: 'all'},
                            {name: 'Fisherman', value: 'Fisherman'},
                            {name: 'Miner', value: 'Miner'},
                            {name: 'Chef', value: 'Chef'},
                            {name: 'Programmer', value: 'Programmer'},
                            {name: 'Doctor', value: 'Doctor'},
                            {name: 'Builder', value: 'Builder'}
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('collectibles')
                .setDescription('View and purchase rare collectible items')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('What you want to do with collectibles')
                        .setRequired(true)
                        .addChoices(
                            {name: 'View your collection', value: 'view'},
                            {name: 'Browse the shop', value: 'shop'},
                            {name: 'Buy a collectible', value: 'buy'}
                        )
                )
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The name of the collectible to buy (only needed for buy action)')
                        .setRequired(false)
                )
        )

        .addSubcommand(subcommand =>
            subcommand
                .setName('inventory')
                .setDescription('View your inventory of items and tools')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('Select a user to view their inventory')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('sell')
                .setDescription('Sell items from your inventory')
                .addStringOption(option => 
                    option.setName('item')
                        .setDescription('The item you want to sell')
                        .setRequired(true)
                )
                .addIntegerOption(option => 
                    option.setName('amount')
                        .setDescription('How many you want to sell')
                        .setRequired(false)
                )
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

 