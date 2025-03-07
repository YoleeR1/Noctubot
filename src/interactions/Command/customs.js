const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const { ChannelType } = require('discord.js');
const Discord = require('discord.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('customs')
        .setDescription('Manage all server customs')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('Get information about the customs category commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('move')
                .setDescription('Move user(s) to a different voice channel')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Choose move type')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Single User', value: 'single' },
                            { name: 'All Users', value: 'all' },
                            { name: 'Two Channels', value: 'twochannels' }
                        )
                )
                .addChannelOption(option =>
                    option.setName('destination')
                        .setDescription('Destination voice channel')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildVoice)
                )
                .addChannelOption(option =>
                    option.setName('channel1')
                        .setDescription('First voice channel to move from')
                        .addChannelTypes(ChannelType.GuildVoice)
                )
                .addChannelOption(option =>
                    option.setName('channel2')
                        .setDescription('Second voice channel to move from (optional)')
                        .addChannelTypes(ChannelType.GuildVoice)
                )
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Select a user to move (only for Single User option)')
                )
        ),

    run: async (client, interaction, args) => {
        try {
            await interaction.deferReply({ fetchReply: true });

            const subcommand = interaction.options.getSubcommand();

            switch(subcommand) {
                case 'help': {
                    const helpEmbed = new Discord.EmbedBuilder()
                        .setColor(0x0099ff)
                        .setTitle('Customs Commands')
                        .setDescription('Here are all available customs commands:')
                        .addFields(
                            { name: '/customs move', value: 'Moves users between voice channels' }
                        );
                    await interaction.editReply({ embeds: [helpEmbed] });
                    break;
                }
                case 'move': {
                    const moveType = interaction.options.getString('type');
                    const destinationChannel = interaction.options.getChannel('destination');
                    let movedUsers = 0;

                    if (!interaction.member.permissions.has('MoveMembers')) {
                        await interaction.editReply({
                            content: 'You do not have permission to move members.',
                            ephemeral: true
                        });
                        return;
                    }

                    try {
                        switch(moveType) {
                            case 'single': {
                                const targetUser = interaction.options.getMember('user');
                                if (!targetUser || !targetUser.voice.channel) {
                                    await interaction.editReply({
                                        content: 'The specified user is not in a voice channel.',
                                        ephemeral: true
                                    });
                                    return;
                                }

                                await targetUser.voice.setChannel(destinationChannel);
                                movedUsers = 1;

                                await interaction.editReply({
                                    content: `Moved ${targetUser.user.username} to ${destinationChannel.name}.`,
                                    ephemeral: true
                                });
                                break;
                            }
                            case 'all': {
                                const voiceChannels = interaction.guild.channels.cache
                                    .filter(channel => channel.type === ChannelType.GuildVoice);

                                for (const channel of voiceChannels.values()) {
                                    const channelMembers = channel.members;
                                    for (const member of channelMembers.values()) {
                                        await member.voice.setChannel(destinationChannel);
                                        movedUsers++;
                                    }
                                }

                                await interaction.editReply({
                                    content: `Moved ${movedUsers} users to ${destinationChannel.name}.`,
                                    ephemeral: true
                                });
                                break;
                            }
                            case 'twochannels': {
                                const channel1 = interaction.options.getChannel('channel1');
                                const channel2 = interaction.options.getChannel('channel2');

                                if (!channel1 && !channel2) {
                                    await interaction.editReply({
                                        content: 'Please specify at least one source channel.',
                                        ephemeral: true
                                    });
                                    return;
                                }

                                const moveMembersFromChannel = async (channel) => {
                                    if (!channel) return 0;
                                    const channelMembers = channel.members;
                                    for (const member of channelMembers.values()) {
                                        await member.voice.setChannel(destinationChannel);
                                    }
                                    return channelMembers.size;
                                };

                                movedUsers += await moveMembersFromChannel(channel1);
                                movedUsers += await moveMembersFromChannel(channel2);

                                const sourceNames = [
                                    channel1?.name,
                                    channel2?.name
                                ].filter(Boolean).join(' and ');

                                await interaction.editReply({
                                    content: `Moved ${movedUsers} users from ${sourceNames} to ${destinationChannel.name}.`,
                                    ephemeral: true
                                });
                                break;
                            }
                        }
                    } catch (error) {
                        console.error('Error in move command:', error);

                        if (error.code === 50013) {
                            await interaction.editReply({
                                content: "I can not move users. Seems like I lack permission :(.",
                                ephemeral: true
                            });
                            return;
                        }

                        if (movedUsers > 0) {
                            await interaction.editReply({
                                content: `Partially completed: Moved ${movedUsers} users, but encountered an issue.`,
                                ephemeral: true
                            });
                            return;
                        }

                        await interaction.editReply({
                            content: 'An error occurred while trying to move users.',
                            ephemeral: true
                        });
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Customs command error:', error);
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
