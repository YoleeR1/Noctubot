module.exports = async (interaction, channel) => {
    const user = interaction.options.getUser('user');
    await channel.permissionOverwrites.edit(user.id, {
        Connect: true,
    });
    await interaction.editReply({
        content: `${user.username} has been whitelisted to join your voice channel.`,
    });
};
