const { CommandInteraction, Client } = require('discord.js');
const { ContextMenuCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

const Schema = require("../../database/models/warnings");

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Warnings')
        .setType(2),

    /** 
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        const perms = await client.checkPerms({
            flags: [Discord.PermissionsBitField.Flags.ManageMessages],
            perms: [Discord.PermissionsBitField.Flags.ManageMessages]
        }, interaction)

        if (perms == false){
            client.errNormal({
                error: "You don't have the required permissions to use this command!",
                type: 'ephemeral'
            }, interaction);
            return;
        }
        await interaction.deferReply({ ephemeral: false });

        const member = interaction.guild.members.cache.get(interaction.targetId) || await interaction.guild.members.fetch(interaction.targetId).catch(() => null);

        if (!member) {
            client.errNormal({
                error: "User not found in the guild!",
                type: 'ephemeral'
            }, interaction);
            return;
        }

        Schema.findOne({ Guild: interaction.guild.id, User: member.id }, async (err, data) => {
            if (data) {
                const currentTime = Date.now();
                const warningExpiryTime = 90 * 24 * 60 * 60 * 1000; // 90 days
                data.Warnings = data.Warnings.filter(warning => (currentTime - warning.Date) <= warningExpiryTime);
                data.save();

                var fields = [];
                data.Warnings.forEach(element => {
                    fields.push({
                        name: "Warning **" + element.Case + "**",
                        value: "Reason: " + element.Reason + "\nModerator <@!" + element.Moderator + ">",
                        inline: true
                    })
                });
                client.embed({
                    title: `${client.emotes.normal.error}・Warnings`,
                    desc: `The warnings of **${member.user.tag}**`,
                    fields: [
                        {
                            name: "Total",
                            value: `${data.Warnings.length}`,
                        },
                        ...fields
                    ],
                    type: 'editreply'
                }, interaction)
            }
            else {
                client.embed({
                    title: `${client.emotes.normal.error}・Warnings`,
                    desc: `User ${member.user.tag} has no warnings!`,
                    type: 'editreply'
                }, interaction)
            }
        })
    },
};

