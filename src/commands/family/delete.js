const Discord = require('discord.js');
const Schema = require("../../database/models/family");

module.exports = async (client, interaction, args) => {
    const author = interaction.user;

    const row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('family_delete')
                .setLabel('Confirm')
                .setStyle(Discord.ButtonStyle.Danger),
            new Discord.ButtonBuilder()
                .setCustomId('family_cancel')
                .setLabel('Cancel')
                .setStyle(Discord.ButtonStyle.Secondary)
        );

    client.embed({
        title: `⚠️・Delete Family`,
        desc: `Are you sure you want to delete your family? This action cannot be undone.`,
        components: [row],
        type: 'editreply'
    }, interaction);

    const filter = i => i.user.id === author.id;
    interaction.channel.awaitMessageComponent({ filter, componentType: Discord.ComponentType.Button, time: 60000 })
        .then(async i => {
            if (i.customId === 'family_delete') {
                const authorData = await Schema.findOne({ Guild: interaction.guild.id, User: author.id });

                if (authorData) {
                    // Remove the user as a parent from their children
                    for (const childId of authorData.Children) {
                        await Schema.findOneAndUpdate(
                            { Guild: interaction.guild.id, User: childId },
                            { $pull: { Parent: author.id } }
                        );
                    }

                    // Remove the children as stepchildren from the partner
                    if (authorData.Partner) {
                        await Schema.findOneAndUpdate(
                            { Guild: interaction.guild.id, User: authorData.Partner },
                            { $pull: { SharedChildren: { $in: authorData.Children } } }
                        );

                        // Remove the partner as a stepparent from the children
                        for (const childId of authorData.Children) {
                            await Schema.findOneAndUpdate(
                                { Guild: interaction.guild.id, User: childId },
                                { $pull: { Parent: authorData.Partner } }
                            );
                        }

                        // Clear the partner's Partner field
                        await Schema.findOneAndUpdate(
                            { Guild: interaction.guild.id, User: authorData.Partner },
                            { $unset: { Partner: "" } }
                        );
                    }

                    // Clear the user's Partner field
                    await Schema.findOneAndUpdate(
                        { Guild: interaction.guild.id, User: author.id },
                        { $unset: { Partner: "" } }
                    );

                    // Delete the user's family record
                    await Schema.findOneAndDelete({ Guild: interaction.guild.id, User: author.id });
                }

                client.embed({
                    title: `✅・Family Deleted`,
                    desc: `Your family has been successfully deleted.`,
                    components: [],
                    type: 'editreply'
                }, interaction);
            } else if (i.customId === 'family_cancel') {
                client.embed({
                    title: `❌・Action Cancelled`,
                    desc: `Your family deletion request has been cancelled.`,
                    components: [],
                    type: 'editreply'
                }, interaction);
            }
        })
        .catch(() => {
            client.embed({
                title: `⏳・Action Timed Out`,
                desc: `You did not respond in time. Family deletion has been cancelled.`,
                components: [],
                type: 'editreply'
            }, interaction);
        });
};

