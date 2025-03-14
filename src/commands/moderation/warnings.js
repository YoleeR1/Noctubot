const Discord = require('discord.js');

const Schema = require("../../database/models/warnings");

module.exports = async (client, interaction, args) => {
    const perms = await client.checkUserPerms({
        flags: [Discord.PermissionsBitField.Flags.ManageMessages],
        perms: [Discord.PermissionsBitField.Flags.ManageMessages]
    }, interaction);

    if (perms == false) {
        client.errNormal({
            error: "You don't have the required permissions to use this command!",
            type: 'editreply'
        }, interaction);
        return;
    }

    const member = interaction.options.getUser('user');
    const targetMember = await interaction.guild.members.fetch(member.id).catch(() => null);

    if (!targetMember) {
        client.errNormal({
            error: "User not found in the guild!",
            type: 'editreply'
        }, interaction);
        return;
    }

    const warningExpiryDays = 90; // 90 days
    const currentTime = Date.now();

    Schema.findOne({ Guild: interaction.guild.id, User: member.id }, async (err, data) => {
        if (data && data.Warnings.length > 0) {
            data.Warnings = data.Warnings.filter(warning => (currentTime - warning.Date) <= (warningExpiryDays * 24 * 60 * 60 * 1000));
            data.save();

            var fields = [];
            var validWarningsCount = 0;

            // Sort warnings by date (most recent first)
            data.Warnings.sort((a, b) => b.Date - a.Date).forEach(element => {
                // Calculate days since warning
                const daysSinceWarning = Math.floor((currentTime - element.Date) / (24 * 60 * 60 * 1000));
                const isExpired = daysSinceWarning > warningExpiryDays;

                // Count valid warnings
                if (!isExpired) validWarningsCount++;

                // Create field for each warning
                fields.push({
                    name: `Case Number: **${element.Case}** ${isExpired ? '(Expired)' : ''}`,
                    value: `Reason: ${element.Reason}\nModerator <@!${element.Moderator}>\nDate: <t:${Math.floor(element.Date / 1000)}:R>`,
                    inline: false
                });
            });

            client.embed({
                title: `${client.emotes.normal.error}・Warnings`,
                desc: `The warnings of **${member.tag}**\n\n**Active Warnings:** ${validWarningsCount}`,
                fields: fields,
                type: 'editreply'
            }, interaction);
        }
        else {
            client.embed({
                title: `${client.emotes.normal.error}・Warnings`,
                desc: `User ${member.tag} has no warnings!`,
                type: 'editreply'
            }, interaction);
        }
    });
};
