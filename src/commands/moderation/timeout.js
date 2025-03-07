const Discord = require('discord.js');
const ModRoles = require("../../database/models/modRoles");

module.exports = async (client, interaction, args) => {
    // Fetch roles from database
    const modRolesData = await ModRoles.findOne({ Guild: interaction.guild.id });
    
    // Default value if not set in database
    const TRIAL_MOD_ROLE = modRolesData?.TrialModRole || '';

    const isRegularMod = interaction.member.permissions.has(Discord.PermissionsBitField.Flags.ModerateMembers);
    const isTrialMod = !isRegularMod && interaction.member.roles.cache.has(TRIAL_MOD_ROLE);

    if (!isRegularMod && !isTrialMod) {
        return client.errNormal({
            error: "You don't have permission to use this command!",
            type: 'editreply'
        }, interaction);
    }

    const user = await interaction.guild.members.fetch(interaction.options.getUser('user').id);
    const time = interaction.options.getNumber('time');
    const reason = interaction.options.getString('reason') || 'Not specified';

    if (user.isCommunicationDisabled()) {
        return client.errNormal({
            error: `${user} has already timed out!`,
            type: 'editreply'
        }, interaction);
    }

    // If trial mod is using the command
    if (isTrialMod) {
        if (user.permissions.has(Discord.PermissionsBitField.Flags.ModerateMembers) || 
            user.roles.cache.has(TRIAL_MOD_ROLE) ||
            user.id === interaction.user.id) {
            return client.errNormal({
                error: "Trial mods cannot timeout moderators, other trial mods, or themselves!",
                type: 'editreply'
            }, interaction);
        }
    } else {
        // Regular mod check - only prevent self-timeout
        if (user.id === interaction.user.id) {
            return client.errNormal({
                error: "You cannot timeout yourself!",
                type: 'editreply'
            }, interaction);
        }
    }

    user.timeout(time * 60 * 1000, reason).then(m => {
        client.succNormal({
            text: `${user} successfully timed out for **${time} minutes**`,
            fields: [
                {
                    name: `💬┆Reason`,
                    value: `${reason}`
                }
            ],
            type: 'editreply'
        }, interaction);
    }).catch(e => {
        client.errNormal({
            error: `I can't timeout ${user.tag}`,
            type: 'editreply'
        }, interaction);
    });
}