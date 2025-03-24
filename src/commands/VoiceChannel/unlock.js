module.exports = async (interaction, channel) => {
    try {
        await channel.permissionOverwrites.edit(interaction.guild.id, {
            Connect: true,
        });
        await interaction.editReply({
            content: 'Your voice channel has been unlocked.',
        });
    } catch (error) {
        console.error(error);
        await interaction.editReply({
            content: 'Failed to unlock the voice channel. Ensure the bot has the necessary permissions.',
        });
    }
};
