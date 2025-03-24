module.exports = async (interaction, channel) => {
    await channel.permissionOverwrites.edit(interaction.guild.id, {
        Connect: true,
    });
    await interaction.editReply({
        content: 'Your voice channel has been unlocked.',
    });
};
