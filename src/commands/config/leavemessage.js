const Discord = require('discord.js');

const inviteMessages = require("../../database/models/inviteMessages");

module.exports = async (client, interaction, args) => {
    const perms = await client.checkUserPerms({
        flags: [Discord.PermissionsBitField.Flags.ManageMessages],
        perms: [Discord.PermissionsBitField.Flags.ManageMessages]
    }, interaction)

    if (perms == false) return;

    const message = interaction.options.getString('message');

    if (message.toUpperCase() == "HELP") {
        return client.embed({
            title: `ℹ️・Leave Message Options`,
            desc: `Leave message options: 
• {user:username} - User's username
• {user:discriminator} - User's discriminator
• {user:tag} - User's tag
• {user:mention} - Mention a user
• {inviter:username} - Inviter's username
• {inviter:discriminator} - Inviter's discriminator
• {inviter:tag} - Inviter's tag
• {inviter:mention} - Inviter's mention
• {inviter:invites} - Inviter's invites
• {inviter:invites:left} - Inviter's left invites
• {guild:name} - Server name
• {guild:members} - Server members count
• {timestamp} - Current time
• [split] - Split sections into multiple embed parts
• {color:#HEX} - Override embed color`,
            type: 'editreply'
        }, interaction)
    }

    if (message.toUpperCase() == "DEFAULT") {
        inviteMessages.findOne({ Guild: interaction.guild.id }, async (err, data) => {
            if (data) {
                data.inviteLeave = null;
                data.save();

                client.succNormal({
                    text: `Leave message deleted!`,
                    type: 'editreply'
                }, interaction);
            }
        })
    }
    else {
        inviteMessages.findOne({ Guild: interaction.guild.id }, async (err, data) => {
            if (data) {
                data.inviteLeave = message;
                data.save();
            }
            else {
                new inviteMessages({
                    Guild: interaction.guild.id,
                    inviteLeave: message
                }).save();
            }
            // Confirm the message was set and show a preview.
            const embeds = client.parseCustomMessage(message, { 
                member: interaction.member, // added member for proper token replacements
                guild: interaction.guild, 
                client: client 
            });
            await interaction.editReply({
                content: `<@${interaction.user.id}> Preview:`,
                embeds: embeds
            });
        })
    }
}

