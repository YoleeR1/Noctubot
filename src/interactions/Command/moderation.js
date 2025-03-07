const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const { ChannelType } = require('discord.js');
const Discord = require('discord.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moderation')
        .setDescription('Manage all server moderation')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the moderation category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Ban a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('The reason for the ban'))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear messages')
                .addNumberOption(option => option.setName('amount').setDescription('Amount of messages').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clearuser')
                .setDescription('Clear user messages in a channel')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Kick a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('The reason for the kick'))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('lock')
                .setDescription('Lock a channel')
                .addChannelOption(option => option.setName('channel').setDescription('Select a channel').addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('lockdown')
                .setDescription('Lock all channels')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('nuke')
                .setDescription('Nuke a channel')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('softban')
                .setDescription('Softban a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('The reason for the ban'))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('timeout')
                .setDescription('Timeout a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addNumberOption(option => option.setName('time').setDescription('Number of minutes').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('Reason for the time out').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('tempban')
                .setDescription('Temporarily ban a user')
                .addStringOption(option =>
                    option.setName('user')
                        .setDescription('User ID or mention')
                        .setRequired(true)
                )
                .addNumberOption(option =>
                    option.setName('duration')
                        .setDescription('Duration of the ban')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('unit')
                        .setDescription('Time unit for ban duration')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Seconds', value: 'seconds' },
                            { name: 'Minutes', value: 'minutes' },
                            { name: 'Hours', value: 'hours' },
                            { name: 'Days', value: 'days' },
                            { name: 'Weeks', value: 'weeks' },
                            { name: 'Months', value: 'months' },
                            { name: 'Years', value: 'years' }
                        )
                )
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('The reason for the ban')
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlock')
                .setDescription('Unlock a channel')
                .addChannelOption(option => option.setName('channel').setDescription('Select a channel').addChannelTypes(ChannelType.GuildText))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unban')
                .setDescription('Unban a user')
                .addStringOption(option => option.setName('user').setDescription('Give a user id').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('banlist')
                .setDescription('Get all banned users')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('warn')
                .setDescription('Warn a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addStringOption(option => option.setName('reason').setDescription('The reason for the warn').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unwarn')
                .setDescription('Unwarn a user')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
                .addIntegerOption(option => option.setName('case').setDescription('Give a case number').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('warnings')
                .setDescription('See a users warnings')
                .addUserOption(option => option.setName('user').setDescription('Select a user').setRequired(true))
        ),

    run: async (client, interaction, args) => {
        try {
            await interaction.deferReply({ fetchReply: true });

            const subcommand = interaction.options.getSubcommand();

            switch(subcommand) {
                case 'ban': {
                    try {
                        const banCommand = require(path.join(__dirname, '..', '..', 'commands', 'moderation', 'ban.js'));
                        await banCommand.execute(client, interaction, args);
                    } catch (banError) {
                        console.error('Ban command error:', banError);
                        await interaction.editReply({
                            content: 'Failed to execute ban command. Please contact support.',
                            ephemeral: true
                        });
                    }
                    break;
                }
                case 'help': {
                    const helpEmbed = new Discord.EmbedBuilder()
                        .setColor(0x0099ff)
                        .setTitle('Moderation Commands')
                        .setDescription('Here are all available moderation commands:')
                        .addFields(
                            { name: '/moderation ban', value: 'Ban a user with optional duration' },
                            { name: '/moderation kick', value: 'Kick a user from the server' },
                            { name: '/moderation timeout', value: 'Timeout a user' },
                            { name: '/moderation clear', value: 'Clear messages in a channel' },
                            { name: '/moderation warn', value: 'Warn a user' }
                        );
                    await interaction.editReply({ embeds: [helpEmbed] });
                    break;
                }
                
                case 'tempban': {
                    try {
                        const tempbanCommand = require(path.join(__dirname, '..', '..', 'commands', 'moderation', 'tempban.js'));
                        await tempbanCommand.execute(client, interaction, args);
                    } catch (tempbanError) {
                        console.error('Tempban command error:', tempbanError);
                        await interaction.editReply({
                            content: 'Failed to execute tempban command. Please contact support.',
                            ephemeral: true
                        });
                    }
                    break;
                }

                default: {
                    try {
                        await client.loadSubcommands(client, interaction, args);
                    } catch (loadError) {
                        console.error('Subcommand load error:', loadError);
                        await interaction.editReply({
                            content: 'An error occurred while processing the command.',
                            ephemeral: true
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Moderation command error:', error);
            try {
                await interaction.editReply({
                    content: 'An unexpected error occurred.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Error replying to interaction:', replyError);
            }
        }
    }
};
