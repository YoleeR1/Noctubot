const { SlashCommandBuilder } = require('discord.js');
const VoiceChannel = require('../../database/models/VoiceChannel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vc')
        .setDescription('Voice Channel Management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('lock')
                .setDescription('Lock your personal voice channel')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlock')
                .setDescription('Unlock your personal voice channel')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist')
                .setDescription('Whitelist a user to join your personal voice channel')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to whitelist')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('blacklist')
                .setDescription('Blacklist a user from joining your personal voice channel')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to blacklist')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset a user\'s permissions in your personal voice channel')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('User to reset permissions for')
                        .setRequired(true)
                )
        ),

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // Fetch the user's voice channel from the database
        const voiceChannelData = await VoiceChannel.findOne({ guildId, ownerId: userId });
        if (!voiceChannelData) {
            return interaction.editReply({
                content: 'You do not own a personal voice channel.',
            });
        }

        const channel = interaction.guild.channels.cache.get(voiceChannelData.channelId);
        if (!channel) {
            await VoiceChannel.deleteOne({ guildId, ownerId: userId });
            return interaction.editReply({
                content: 'Your personal voice channel no longer exists.',
            });
        }

        try {
            const command = require(`../../commands/VoiceChannel/${subcommand}`);
            await command(interaction, channel);
        } catch (error) {
            console.error(`Error executing VC subcommand '${subcommand}':`, error);
            await interaction.editReply({
                content: 'An error occurred while processing your request.',
            });
        }
    },
};
