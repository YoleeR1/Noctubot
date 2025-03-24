module.exports = async (interaction, channel) => {
    // Lock the voice channel by denying the "Connect" permission for the guild
    await channel.permissionOverwrites.edit(interaction.guild.id, {
        Connect: false,
    });

    // Reply to the interaction to confirm the action
    await interaction.editReply({
        content: 'Your voice channel has been locked.',
    });
};
