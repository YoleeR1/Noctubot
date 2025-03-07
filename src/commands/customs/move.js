const { SlashCommandSubcommandBuilder } = require('discord.js');
const { ChannelType } = require('discord.js');

module.exports = {
    data: {
        name: 'move',
        description: 'Move user(s) to a different voice channel',
        type: 1, // Subcommand type
        options: [
            {
                name: 'type',
                description: 'Choose move type',
                type: 3, // String type
                required: true,
                choices: [
                    { name: 'Single User', value: 'single' },
                    { name: 'All Users', value: 'all' },
                    { name: 'Between Channels', value: 'between' }
                ]
            },
            {
                name: 'user',
                description: 'Select a user to move (only for Single User option)',
                type: 6, // User type
                required: false
            },
            {
                name: 'source',
                description: 'Select source voice channel(s) (for Between Channels option)',
                type: 7, // Channel type
                required: false,
                channel_types: [ChannelType.GuildVoice]
            },
            {
                name: 'source2',
                description: 'Select a second source voice channel (optional)',
                type: 7, // Channel type
                required: false,
                channel_types: [ChannelType.GuildVoice]
            },
            {
                name: 'destination',
                description: 'Select the destination voice channel',
                type: 7, // Channel type
                required: true,
                channel_types: [ChannelType.GuildVoice]
            }
        ]
    },

    run: async (client, interaction) => {
        // Ensure the interaction is in a guild
        if (!interaction.guild) {
            return interaction.reply({
                content: 'This command can only be used in a server.',
                ephemeral: true
            });
        }

        // Get the type of move (single, all, or between)
        const moveType = interaction.options.getString('type');

        // Get the destination channel
        const destinationChannel = interaction.options.getChannel('destination');

        // Variable to track moved users
        let movedUsers = 0;

        try {
            // Check if the user has permission to move members
            if (!interaction.member.permissions.has('MoveMembers')) {
                return interaction.reply({
                    content: 'You do not have permission to move members.',
                    ephemeral: true
                });
            }

            // Handle single user move
            if (moveType === 'single') {
                const targetUser = interaction.options.getMember('user');

                // Check if user is in a voice channel
                if (!targetUser || !targetUser.voice.channel) {
                    return interaction.reply({
                        content: 'The specified user is not in a voice channel.',
                        ephemeral: true
                    });
                }

                // Move the specific user
                await targetUser.voice.setChannel(destinationChannel);
                movedUsers = 1;

                await interaction.reply({
                    content: `Moved ${targetUser.user.username} to ${destinationChannel.name}.`,
                    ephemeral: true
                });
            }
            // Handle move all users
            else if (moveType === 'all') {
                // Get all voice channels in the guild
                const voiceChannels = interaction.guild.channels.cache
                    .filter(channel => channel.type === ChannelType.GuildVoice);

                // Iterate through each voice channel
                for (const channel of voiceChannels.values()) {
                    // Get members in the current channel
                    const channelMembers = channel.members;

                    // Move each member to the destination channel
                    for (const member of channelMembers.values()) {
                        await member.voice.setChannel(destinationChannel);
                        movedUsers++;
                    }
                }

                await interaction.reply({
                    content: `Moved all users to ${destinationChannel.name}.`,
                    ephemeral: true
                });
            }
            // Handle move between specific channels
            else if (moveType === 'between') {
                // Get source channels
                const sourceChannel = interaction.options.getChannel('source');
                const sourceChannel2 = interaction.options.getChannel('source2');

                // If no source channels specified, return an error
                if (!sourceChannel && !sourceChannel2) {
                    return interaction.reply({
                        content: 'Please specify at least one source channel.',
                        ephemeral: true
                    });
                }

                // Function to move members from a source channel
                const moveMembersFromChannel = async (channel) => {
                    if (!channel) return 0;

                    const channelMembers = channel.members;
                    for (const member of channelMembers.values()) {
                        await member.voice.setChannel(destinationChannel);
                    }
                    return channelMembers.size;
                };

                // Move members from specified source channels
                movedUsers += await moveMembersFromChannel(sourceChannel);
                movedUsers += await moveMembersFromChannel(sourceChannel2);

                // Prepare source channel names for the reply
                const sourceNames = [
                    sourceChannel ? sourceChannel.name : null,
                    sourceChannel2 ? sourceChannel2.name : null
                ].filter(name => name !== null).join(' and ');

                await interaction.reply({
                    content: `Moved ${movedUsers} users from ${sourceNames} to ${destinationChannel.name}.`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error in move command:', error);
            
            // Check if the error is related to permissions or channel access
            if (error.code === 50013) {
                return interaction.reply({
                    content: 'I do not have permission to move all users.',
                    ephemeral: true
                });
            }
            
            // Check if the error occurs after some users have been moved
            if (movedUsers > 0) {
                return interaction.reply({
                    content: `Partially completed: Moved ${movedUsers} users, but encountered an issue.`,
                    ephemeral: true
                });
            }

            await interaction.reply({
                content: 'An error occurred while trying to move users.',
                ephemeral: true
            });
        }
    }
};
