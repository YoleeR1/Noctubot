const Discord = require('discord.js');

module.exports = {
    // Use an execute method to match the expected calling pattern in moderation.js
    execute: async (client, interaction, args) => {
        // Check permissions for banning members
        const perms = await client.checkPerms({
            flags: [Discord.PermissionsBitField.Flags.BanMembers],
            perms: [Discord.PermissionsBitField.Flags.BanMembers]
        }, interaction)
        
        // If user lacks permissions, exit early
        if (perms == false) return;

        // Get the user from interaction options
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'Not given';

        try {
            // Try to fetch the member from the guild
            let member;
            try {
                member = await interaction.guild.members.fetch(targetUser.id);
            } catch {
                // If fetching fails, it might be a user ID that's not in the server
                try {
                    // Attempt to fetch the user by ID
                    member = await interaction.guild.members.fetch(targetUser.id);
                } catch {
                    // If we can't fetch the member, try to ban by user ID
                    try {
                        await interaction.guild.bans.create(targetUser.id, {
                            reason: reason
                        });

                        return client.succNormal({
                            text: "This user's ID has been banned successfully!",
                            fields: [
                                {
                                    name: "👤┆Banned user",
                                    value: targetUser.tag || targetUser.id,
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
                    } catch (error) {
                        return client.errNormal({
                            error: "Could not ban the user. Either the user is already banned or the ID is invalid.",
                            type: 'editreply'
                        }, interaction);
                    }
                }
            }

            // Check if the member can be banned (prevent banning moderators)
            if (member.permissions.has(Discord.PermissionsBitField.Flags.BanMembers)) {
                return client.errNormal({
                    error: "You can't ban a moderator",
                    type: 'editreply'
                }, interaction);
            }

            // Send ban notification embed
            client.embed({
                title: `🔨・Ban`,
                desc: `You've been banned from **${interaction.guild.name}**`,
                fields: [
                    {
                        name: "👤┆Banned by",
                        value: interaction.user.tag,
                        inline: true
                    },
                    {
                        name: "💬┆Reason",
                        value: reason,
                        inline: true
                    }
                ]
            }, member).then(async function () {
                // Ban the member
                await member.ban({ reason: reason });

                client.succNormal({
                    text: "The specified user has been successfully banned and received a notification!",
                    fields: [
                        {
                            name: "👤┆Banned user",
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
            }).catch(async function () {
                // If sending the embed fails, still ban the user
                await member.ban({ reason: reason });

                client.succNormal({
                    text: "The given user has been successfully banned, but did not receive a notification!",
                    fields: [
                        {
                            name: "👤┆Banned user",
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
            });
        } catch (error) {
            console.error('Ban command error:', error);

            client.errNormal({
                error: "An error occurred while trying to ban the user.",
                type: 'editreply'
            }, interaction);
        }
    }
};
