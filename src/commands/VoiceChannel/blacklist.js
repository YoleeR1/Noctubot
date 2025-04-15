module.exports = async (interaction, channel) => {
    try {
        const user = interaction.options.getUser('user');

        // Prevent blacklisting yourself
        if (user.id === interaction.user.id) {
            return interaction.editReply({
                content: 'You cannot blacklist yourself from your own voice channel.',
            });
        }

        await channel.permissionOverwrites.edit(user.id, {
            Connect: false,
        });

        // Kick the user if they are currently in the voice channel
        const member = channel.members.get(user.id);
        if (member) {
            await member.voice.disconnect();
        }

        await interaction.editReply({
            content: `${user.username} has been blacklisted from joining your voice channel and has been removed from it.`,
        });
    } catch (error) {
        console.error(error);
        await interaction.editReply({
            content: 'Failed to blacklist the user. Ensure the bot has the necessary permissions.',
        });
    }
};
