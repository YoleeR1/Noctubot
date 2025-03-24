module.exports = async (interaction, channel) => {
    const user = interaction.options.getUser('user');
    await channel.permissionOverwrites.delete(user.id);

    await interaction.editReply({
        content: `Permissions for ${user.username} have been reset in your voice channel.`,
    });
};
