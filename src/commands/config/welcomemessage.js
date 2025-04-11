const Discord = require('discord.js');
const inviteMessages = require("../../database/models/inviteMessages");

module.exports = async (client, interaction, args) => {
    const perms = await client.checkUserPerms({
        flags: [Discord.PermissionsBitField.Flags.ManageMessages],
        perms: [Discord.PermissionsBitField.Flags.ManageMessages]
    }, interaction);
    
    if (perms == false) return;

    const message = interaction.options.getString('message');
    
    if (message.toUpperCase() == "HELP") {
        return client.embed({
            title: `ℹ️・Welcome Message Options`,
            desc: `Join message options: 
• {user:username} - User's username
• {user:discriminator} - User's discriminator
• {user:tag} - User's tag
• {user:mention} - Mention a user
• {user:avatar} - User's avatar URL
• {guild:name} - Server name
• {guild:members} - Server members count
• {timestamp} - Current time (in user's timezone)
• [split] - Split sections into multiple embed parts
• {color:#HEX} - Override embed color`,
            color: 0x2F3136,
            type: 'editreply'
        }, interaction)
    }

    if (message.toUpperCase() == "DEFAULT") {
        inviteMessages.findOne({ Guild: interaction.guild.id }, async (err, data) => {
            if (data) {
                data.inviteJoin = null;
                data.save();
                client.succNormal({
                    text: `Welcome message deleted!`,
                    type: 'editreply'
                }, interaction);
            }
        });
        return;
    }

    inviteMessages.findOne({ Guild: interaction.guild.id }, async (err, data) => {
        if (data) {
            data.inviteJoin = message;
            data.save();
        } else {
            new inviteMessages({
                Guild: interaction.guild.id,
                inviteJoin: message
            }).save();
        }
        // Generate preview using the new parser with the real member.
        const embeds = client.parseCustomMessage(message, { 
            member: interaction.member, 
            guild: interaction.guild, 
            client: client 
        });
        await interaction.editReply({
            content: `<@${interaction.user.id}> Preview:`,
            embeds: embeds
        });
    });
};
