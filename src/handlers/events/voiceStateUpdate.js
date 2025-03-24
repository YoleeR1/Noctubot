const Discord = require('discord.js');
const VoiceChannel = require('../../database/models/VoiceChannel');
const GuildConfig = require('../../database/models/GuildConfig');

module.exports = async (client, oldState, newState) => {
    try {
        // Ensure oldState and newState are defined
        if (!oldState || !newState) return;

        // Ensure newState.guild and newState.member are defined
        if (!newState.guild || !newState.member || newState.member.user.bot) return;

        // Fetch the guild's join-to-create channel configuration
        const guildConfig = await GuildConfig.findOne({ guildId: newState.guild.id });
        if (!guildConfig || !guildConfig.joinToCreateChannelId) return;

        const joinToCreateChannelId = guildConfig.joinToCreateChannelId;

        // Check if the user joined the designated join-to-create channel
        if (newState.channelId === joinToCreateChannelId) {
            // Create a new voice channel for the user
            const channelName = `${newState.member.user.username}'s Channel`;
            const newChannel = await newState.guild.channels.create({
                name: channelName,
                type: Discord.ChannelType.GuildVoice,
                parent: newState.channel?.parentId, // Use the same category as the join-to-create channel
                permissionOverwrites: [
                    {
                        id: newState.guild.id,
                        allow: [Discord.PermissionsBitField.Flags.Connect],
                    },
                    {
                        id: newState.member.id,
                        allow: [Discord.PermissionsBitField.Flags.ManageChannels],
                    },
                ],
            });

            // Move the user to the new channel
            await newState.member.voice.setChannel(newChannel);

            // Save the channel details to the database
            await VoiceChannel.create({
                guildId: newState.guild.id,
                channelId: newChannel.id,
                ownerId: newState.member.id,
                locked: false,
                whitelist: [],
                blacklist: [],
            });
        }

        // Check if a dynamically created channel is empty and delete it
        if (oldState.channelId && oldState.channel?.members.size === 0) {
            const voiceChannelData = await VoiceChannel.findOne({ channelId: oldState.channelId });
            if (voiceChannelData) {
                await oldState.channel.delete();
                await VoiceChannel.deleteOne({ channelId: oldState.channelId });
            }
        }
    } catch (error) {
        console.error('Error in voiceStateUpdate event:', error);
    }
};
