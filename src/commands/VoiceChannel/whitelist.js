module.exports = async (interaction, channel) => {
    try {
        const user = interaction.options.getUser('user');
        await channel.permissionOverwrites.edit(user.id, {
            Connect: true,
        });
        await interaction.editReply({
            content: `${user.username} has been whitelisted to join your voice channel.`,
        });
    } catch (error) {
        console.error(error);
        await interaction.editReply({
            content: 'Failed to whitelist the user. Ensure the bot has the necessary permissions.',
        });
    }
};
