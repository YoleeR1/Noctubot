const Discord = require('discord.js');
const Schema = require("../../database/models/warnings");
const Case = require("../../database/models/warnCase");
const ModRoles = require("../../database/models/modRoles");
const WarningSettings = require("../../database/models/warningSettings");

module.exports = async (client, interaction, args) => {
    // Fetch roles and settings from database
    const modRolesData = await ModRoles.findOne({ Guild: interaction.guild.id });
    const warningSettingsData = await WarningSettings.findOne({ Guild: interaction.guild.id });
    
    // Default values if not set in database
    const TRIAL_MOD_ROLE = modRolesData?.TrialModRole || '';
    const MODERATOR_ROLE_ID = modRolesData?.ModeratorRole || '';
    const SPECIAL_ACCESS_ROLE_ID = modRolesData?.SpecialAccessRole || '';
    const WARNINGS_CHANNEL_ID = warningSettingsData?.WarningsChannel || '';
    const maxWarnings = warningSettingsData?.MaxWarnings || 3;
    const warningExpiryDays = warningSettingsData?.WarningExpiryDays || 90;

    const isRegularMod = interaction.memberPermissions.has(Discord.PermissionsBitField.Flags.ManageMessages);
    const hasSpecialRole = interaction.member.roles.cache.has(SPECIAL_ACCESS_ROLE_ID);
    const isTrialMod = !isRegularMod && !hasSpecialRole && interaction.member.roles.cache.has(TRIAL_MOD_ROLE);

    if (!isRegularMod && !hasSpecialRole && !isTrialMod) {
        return client.errNormal({
            error: "You don't have permission to use this command!",
            type: 'editreply'
        }, interaction);
    }

    const member = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Not specified';
    let caseNumber;

    const targetMember = await interaction.guild.members.fetch(member.id).catch(() => null);
    if (!targetMember) {
        return client.errNormal({
            error: "Unable to find the specified user",
            type: 'editreply'
        }, interaction);
    }

    // If trial mod is using the command
    if (isTrialMod) {
        if (targetMember.permissions.has(Discord.PermissionsBitField.Flags.ManageMessages) || 
            targetMember.roles.cache.has(MODERATOR_ROLE_ID) ||
            targetMember.roles.cache.has(TRIAL_MOD_ROLE) ||
            targetMember.id === interaction.user.id) {
            return client.errNormal({
                error: "Trial mods cannot warn moderators, other trial mods, or themselves!",
                type: 'editreply'
            }, interaction);
        }
    } else {
        // Regular mod check - only prevent self-warn
        if (targetMember.id === interaction.user.id) {
            return client.errNormal({
                error: "You cannot warn yourself!",
                type: 'editreply'
            }, interaction);
        }
    }

    await Case.findOne({ Guild: interaction.guild.id }).then(async data => {
        if (!data) {
            new Case({
                Guild: interaction.guild.id,
                Case: 1
            }).save();
            caseNumber = 1;
        } else {
            data.Case += 1;
            data.save();
            caseNumber = data.Case;
        }
    });

    Schema.findOne({ Guild: interaction.guild.id, User: member.id }, async (err, data) => {
        if (data) {
            const currentTime = Date.now();
            const validWarnings = data.Warnings.filter(warning =>
                (currentTime - warning.Date) <= (warningExpiryDays * 24 * 60 * 60 * 1000)
            );

            validWarnings.push({
                Moderator: interaction.user.id,
                Reason: reason,
                Date: currentTime,
                Case: caseNumber
            });

            data.Warnings = [
                ...data.Warnings.filter(warning =>
                    (currentTime - warning.Date) > (warningExpiryDays * 24 * 60 * 60 * 1000)
                ),
                ...validWarnings
            ];
            data.save();

            if (validWarnings.length >= maxWarnings) {
                try {
                    const warningsChannel = await client.channels.fetch(WARNINGS_CHANNEL_ID);

                    if (warningsChannel) {
                        const moderatorEmbed = {
                            color: 0xFF0000,
                            title: '⚠️ User Warnings Notification',
                            description: `User **${member.tag}** (${member.id}) has ${validWarnings.length} active warnings.`,
                            fields: [
                                {
                                    name: 'Total Active Warnings',
                                    value: `${validWarnings.length}`,
                                    inline: true
                                },
                                {
                                    name: 'User Profile',
                                    value: `<@${member.id}>`,
                                    inline: true
                                },
                                {
                                    name: 'Latest Warning Details',
                                    value: `**Case #${caseNumber}**\n` +
                                        `Moderator: <@${interaction.user.id}>\n` +
                                        `Reason: ${reason}\n` +
                                        `Date: <t:${Math.floor(currentTime / 1000)}:R>`
                                },
                                {
                                    name: 'Warning History',
                                    value: validWarnings.map(warn =>
                                        `**Case #${warn.Case}**\n` +
                                        `Moderator: <@${warn.Moderator}>\n` +
                                        `Reason: ${warn.Reason}\n` +
                                        `Date: <t:${Math.floor(warn.Date / 1000)}:R>`
                                    ).join('\n\n')
                                }
                            ],
                            footer: {
                                text: 'Review warnings and consider appropriate action'
                            },
                            timestamp: new Date()
                        };

                        await warningsChannel.send({
                            content: `<@&${MODERATOR_ROLE_ID}>`,
                            embeds: [moderatorEmbed]
                        });
                    }
                } catch (notifyError) {
                    console.error('Error sending moderator notification:', notifyError);
                }
            }
        } else {
            new Schema({
                Guild: interaction.guild.id,
                User: member.id,
                Warnings: [{
                    Moderator: interaction.user.id,
                    Reason: reason,
                    Date: Date.now(),
                    Case: caseNumber
                }]
            }).save();
        }
    });

    client.embed({
        title: `🔨・Warn`,
        desc: `You've been warned in **${interaction.guild.name}**`,
        fields: [
            {
                name: "👤┆Moderator",
                value: interaction.user.tag,
                inline: true
            },
            {
                name: "📄┆Reason",
                value: reason,
                inline: true
            }
        ]
    }, member).catch(() => { });

    client.emit('warnAdd', member, interaction.user, reason);
    client.succNormal({
        text: `User has received a warning!`,
        fields: [
            {
                name: "👤┆User",
                value: `${member}`,
                inline: true
            },
            {
                name: "👤┆Moderator",
                value: `${interaction.user}`,
                inline: true
            },
            {
                name: "📄┆Reason",
                value: reason,
                inline: false
            }
        ],
        type: 'editreply'
    }, interaction);
}