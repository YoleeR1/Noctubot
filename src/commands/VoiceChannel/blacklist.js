module.exports = async (interaction, channel) => {
    const user = interaction.options.getUser('user');
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
};
