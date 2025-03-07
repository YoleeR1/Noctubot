const Discord = require('discord.js');
const ModRoles = require('../../database/models/modRoles');

module.exports = async (client, interaction, args) => {
    const role = interaction.options.getRole('role');

    if (!role) return client.errNormal({
        error: "Please provide a valid role!",
        type: 'editreply'
    }, interaction);

    // Check if there's an existing entry for this guild
    const data = await ModRoles.findOne({ Guild: interaction.guild.id });

    if (data) {
        data.TrialModRole = role.id;
        data.save();
    } else {
        // Create a new entry
        await new ModRoles({
            Guild: interaction.guild.id,
            TrialModRole: role.id
        }).save();
    }

    client.succNormal({
        text: `The trial moderator role has been set to <@&${role.id}>!`,
        type: 'editreply'
    }, interaction);
}