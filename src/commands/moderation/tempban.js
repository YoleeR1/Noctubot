const Discord = require('discord.js');
const TempSchema = require("../../database/models/tempban");

module.exports = {
    execute: async (client, interaction, args) => {
        // Permission check
        const perms = await client.checkPerms({
            flags: [Discord.PermissionsBitField.Flags.BanMembers],
            perms: [Discord.PermissionsBitField.Flags.BanMembers]
        }, interaction);
        if (perms === false) return;

        // Get user (supports both mention and ID)
        let user;
        const userInput = interaction.options.getString('user');
        try {
            // Try to fetch user by ID first
            user = await client.users.fetch(userInput);
        } catch {
            // If fetching by ID fails, check if it's a mention
            const mentionMatch = userInput.match(/^<@!?(\d+)>$/);
            if (mentionMatch) {
                user = await client.users.fetch(mentionMatch[1]);
            } else {
                return client.errNormal({
                    error: "Invalid user. Please provide a valid user ID or mention.",
                    type: 'editreply'
                }, interaction);
            }
        }

        // Get ban details
        const duration = interaction.options.getNumber('duration');
        const unit = interaction.options.getString('unit');
        const reason = interaction.options.getString('reason') || 'Not given';

        // Calculate expiration time
        const expires = new Date();
        switch(unit) {
            case 'seconds': expires.setSeconds(expires.getSeconds() + duration); break;
            case 'minutes': expires.setMinutes(expires.getMinutes() + duration); break;
            case 'hours': expires.setHours(expires.getHours() + duration); break;
            case 'days': expires.setDate(expires.getDate() + duration); break;
            case 'weeks': expires.setDate(expires.getDate() + (duration * 7)); break;
            case 'months': expires.setMonth(expires.getMonth() + duration); break;
            case 'years': expires.setFullYear(expires.getFullYear() + duration); break;
            default:
                return client.errNormal({
                    error: "Invalid time unit.",
                    type: 'editreply'
                }, interaction);
        }

        try {
            // Try to fetch member in the guild (but don't fail if not found)
            let member;
            try {
                member = await interaction.guild.members.fetch(user.id);
            } catch {
                // Member not in the server, which is fine for banning
                member = null;
            }

            // Check if member is a moderator (if found in server)
            if (member && (member.permissions.has(Discord.PermissionsBitField.Flags.BanMembers))) {
                return client.errNormal({
                    error: "You can't ban a moderator",
                    type: 'editreply'
                }, interaction);
            }

            // Send DM to user
            try {
                await client.embed({
                    title: `🔨・Temporary Ban`,
                    desc: `You've been temporarily banned from **${interaction.guild.name}**`,
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
                        },
                        {
                            name: "⏰┆Ban Duration",
                            value: `${duration} ${unit}`,
                            inline: true
                        }
                    ]
                }, user);
            } catch (dmError) {
                console.log('Could not send DM to user');
            }

            // Ban the user
            await interaction.guild.bans.create(user, { reason: reason });

            // Save to temp ban schema
            await new TempSchema({
                guildId: interaction.guild.id,
                userId: user.id,
                expires,
            }).save();

            // Confirmation message
            await client.succNormal({
                text: `Successfully banned ${user.tag} for ${duration} ${unit}`,
                fields: [
                    {
                        name: "👤┆Banned user",
                        value: user.tag,
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
            console.error('Tempban error:', error);
            await client.errNormal({
                error: "Failed to ban user. Ensure the bot has proper permissions.",
                type: 'editreply'
            }, interaction);
        }
    }
};
