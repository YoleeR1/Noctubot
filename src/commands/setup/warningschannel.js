const Discord = require('discord.js');
const WarningSettings = require('../../database/models/warningSettings');

module.exports = async (client, interaction, args) => {
    const channel = interaction.options.getChannel('channel');

    if (!channel || channel.type !== Discord.ChannelType.GuildText) return client.errNormal({
        error: "Please provide a valid text channel!",
        type: 'editreply'
    }, interaction);

    // Check if there's an existing entry for this guild
    const data = await WarningSettings.findOne({ Guild: interaction.guild.id });

    if (data) {
        data.WarningsChannel = channel.id;
        data.save();
    } else {
        // Create a new entry
        await new WarningSettings({
            Guild: interaction.guild.id,
            WarningsChannel: channel.id
        }).save();
    }

    client.succNormal({
        text: `The warnings channel has been set to ${channel}!`,
        type: 'editreply'
    }, interaction);
}