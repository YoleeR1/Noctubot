const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const { ChannelType } = require('discord.js');
const Discord = require('discord.js');
const GuildConfig = require('../../database/models/GuildConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Manage the Bot setups')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the setup category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('tickets')
                .setDescription('Setup the tickets')
                .addChannelOption(option => option.setName('category').setDescription('Select a category where the tickets should come in').setRequired(true).addChannelTypes(ChannelType.GuildCategory))
                .addRoleOption(option => option.setName('role').setDescription('Select the support role').setRequired(true))
                .addChannelOption(option => option.setName('channel').setDescription('The channel for the ticket panel').setRequired(true).addChannelTypes(ChannelType.GuildText))
                .addChannelOption(option => option.setName('logs').setDescription('The channel for the ticket logs').setRequired(true).addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('customvoice')
                .setDescription('Setup the custom voice channels')
                .addChannelOption(option => option.setName('category').setDescription('Select a category where the channels come in').setRequired(true).addChannelTypes(ChannelType.GuildCategory))
                .addStringOption(option => option.setName('channelname').setDescription('The template for the channel names').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('logs')
                .setDescription('Set the logs from the server')
                .addStringOption(option =>
                    option.setName('setup')
                        .setDescription('The setup that you want')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Server logs', value: 'serverLogs' },
                            { name: 'Level logs', value: 'levelLogs' },
                            { name: 'Boost logs', value: 'boostLogs' }
                        )
                )
                .addChannelOption(option => option.setName('channel').setDescription('The channel for the logs').setRequired(true).addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('fun')
                .setDescription('Set the fun channels from the server')
                .addStringOption(option =>
                    option.setName('setup')
                        .setDescription('The setup that you want')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Birthdays', value: 'birthdays' },
                            { name: 'Chatbot', value: 'chatbot' },
                            { name: 'Reviews', value: 'reviews' },
                            { name: 'Suggestions', value: 'suggestions' },
                            { name: 'Starboard', value: 'starboard' }
                        )
                )
                .addChannelOption(option => option.setName('channel').setDescription('The channel for the fun').setRequired(true).addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('games')
                .setDescription('Set the game channels from the server')
                .addStringOption(option =>
                    option.setName('setup')
                        .setDescription('The setup that you want')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Counting', value: 'counting' },
                            { name: 'Guess the number', value: 'gtn' },
                            { name: 'Guess the word', value: 'gtw' },
                            { name: 'Word snake', value: 'wordsnake' }
                        )
                )
                .addChannelOption(option => option.setName('channel').setDescription('The channel for the game').setRequired(true).addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcomechannels')
                .setDescription('Setup the welcome channels')
                .addStringOption(option =>
                    option.setName('setup')
                        .setDescription('The setup that you want')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Welcome channel', value: 'welcomechannel' },
                            { name: 'Leave channnel', value: 'leavechannel' }
                        )
                )
                .addChannelOption(option => option.setName('channel').setDescription('The channel that you want').setRequired(true).addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcomerole')
                .setDescription('Setup the welcome role')
                .addRoleOption(option => option.setName('role').setDescription('The role that you want').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('trialmodrole')
                .setDescription('Setup the trial moderator role')
                .addRoleOption(option => option.setName('role').setDescription('The trial moderator role').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('babymodrole')
                .setDescription('Setup the special access role')
                .addRoleOption(option => option.setName('role').setDescription('The special access role').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('moderatorrole')
                .setDescription('Setup the moderator role')
                .addRoleOption(option => option.setName('role').setDescription('The moderator role').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('warningschannel')
                .setDescription('Setup the warnings channel')
                .addChannelOption(option => option.setName('channel').setDescription('The channel for warnings notifications').setRequired(true).addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ticketpanel')
                .setDescription('Setup the ticket panel')
                .addStringOption(option => option.setName('name').setDescription('The name of the ticket panel').setRequired(true))
                .addStringOption(option => option.setName('description').setDescription('The description of the ticket panel').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('deletesetup')
                .setDescription('Delete a Bot setup')
                .addStringOption(option =>
                    option.setName('setup')
                        .setDescription('The setup that you want')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Tickets', value: 'tickets' },
                            { name: 'Custom voice', value: 'customvoice' },
                            { name: 'Server logs', value: 'serverlogs' },
                            { name: 'Level logs', value: 'levellogs' },
                            { name: 'Boost logs', value: 'boostlogs' },
                            { name: 'Birthdays', value: 'birthdays' },
                            { name: 'Chatbot', value: 'chatbot' },
                            { name: 'Reviews', value: 'reviews' },
                            { name: 'Suggestions', value: 'suggestions' },
                            { name: 'Counting', value: 'counting' },
                            { name: 'Guess the number', value: 'gtn' },
                            { name: 'Guess the word', value: 'gtw' },
                            { name: 'Welcome channel', value: 'welcomechannel' },
                            { name: 'Leave channel', value: 'leavechannel' },
                            { name: 'Welcome role', value: 'welcomerole' },
                            { name: 'Word snake', value: 'wordsnake' },
                            { name: 'Trial mod role', value: 'trialmodrole' },
                            { name: 'Special access role', value: 'babymodrole' },
                            { name: 'Moderator role', value: 'moderatorrole' },
                            { name: 'Warnings channel', value: 'warningschannel' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('jointocreatevc')
                .setDescription('Set up the join-to-create voice channel.')
                .addChannelOption(option => option.setName('channel').setDescription('The voice channel to use for join-to-create.').setRequired(true).addChannelTypes(ChannelType.GuildVoice))
        )
    ,

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */

    run: async (client, interaction, args) => {
        await interaction.deferReply({ ephemeral: true }); // Ensure proper usage of deferReply
        const perms = await client.checkUserPerms({
            flags: [Discord.PermissionsBitField.Flags.Administrator],
            perms: [Discord.PermissionsBitField.Flags.Administrator]
        }, interaction);

        if (perms == false) return;

        // Ensure the jointocreatevc subcommand is handled
        if (interaction.options.getSubcommand() === 'jointocreatevc') {
            const channel = interaction.options.getChannel('channel');
            if (channel.type !== ChannelType.GuildVoice) {
                return interaction.editReply({
                    content: 'Please select a valid voice channel.',
                });
            }

            // Save the join-to-create channel ID in the database
            await GuildConfig.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { joinToCreateChannelId: channel.id },
                { upsert: true }
            );

            return interaction.editReply({
                content: `Join-to-create voice channel has been set to ${channel.name}.`,
            });
        }

        client.loadSubcommands(client, interaction, args);
    },
};

