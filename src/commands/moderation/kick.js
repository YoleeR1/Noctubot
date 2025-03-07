const Discord = require('discord.js');
const ModRoles = require("../../database/models/modRoles");

module.exports = async (client, interaction, args) => {
    // Fetch roles from database
    const modRolesData = await ModRoles.findOne({ Guild: interaction.guild.id });
    
    // Default value if not set in database
    const TRIAL_MOD_ROLE = modRolesData?.TrialModRole || '';
    
    const isRegularMod = interaction.member.permissions.has(Discord.PermissionsBitField.Flags.KickMembers);
    const isTrialMod = !isRegularMod && interaction.member.roles.cache.has(TRIAL_MOD_ROLE);
    
    if (!isRegularMod && !isTrialMod) {
        return client.errNormal({
            error: "You don't have permission to use this command!",
            type: 'editreply'
        }, interaction);
    }

    const member = await interaction.guild.members.fetch(interaction.options.getUser('user').id);
    const reason = interaction.options.getString('reason') || 'Not given';

    // If trial mod is using the command
    if (isTrialMod) {
        if (member.permissions.has(Discord.PermissionsBitField.Flags.KickMembers) || 
            member.permissions.has(Discord.PermissionsBitField.Flags.BanMembers) || 
            member.roles.cache.has(TRIAL_MOD_ROLE) ||
            member.id === interaction.user.id) {
            return client.errNormal({
                error: "Trial mods cannot kick moderators, other trial mods, or themselves!",
                type: 'editreply'
            }, interaction);
        }
    } else {
        // Regular mod check - only prevent self-kick
        if (member.id === interaction.user.id) {
            return client.errNormal({
                error: "You cannot kick yourself!",
                type: 'editreply'
            }, interaction);
        }
    }

    client.embed({
        title: `🔨・Kick`,
        desc: `You've been kicked in **${interaction.guild.name}**`,
        fields: [
            {
                name: "👤┆Kicked by",
                value: interaction.user.tag,
                inline: true
            },
            {
                name: "💬┆Reason",
                value: reason,
                inline: true
            }
        ]
    }, member).then(function () {
        member.kick(reason)
        client.succNormal({
            text: "The specified user has been successfully kicked and successfully received a notification!",
            fields: [
                {
                    name: "👤┆Kicked user",
                    value: member.user.tag,
                    inline: true
                },
                {
                    name: "💬┆Reason",
                    value: reason,
                    inline: true
                }
            ],
            type: 'editreply'
        }, interaction);
    }).catch(function () {
        member.kick(reason)
        client.succNormal({
            text: "The given user has been successfully kicked, but has not received a notification!",
            type: 'editreply'
        }, interaction);
    });
}