module.exports = async (interaction, channel) => {
    try {
        const user = interaction.options.getUser('user');
        await channel.permissionOverwrites.delete(user.id);
        await interaction.editReply({
            content: `Permissions for ${user.username} have been reset in your voice channel.`,
        });
    } catch (error) {
        console.error(error);
        await interaction.editReply({
            content: 'Failed to reset permissions. Ensure the bot has the necessary permissions.',
        });
    }
};
