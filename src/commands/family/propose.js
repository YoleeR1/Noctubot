const Discord = require('discord.js');
const Schema = require("../../database/models/family");

module.exports = async (client, interaction, args) => {
    const target = interaction.options.getUser('user');
    const author = interaction.user;

    if (author.id === target.id) return client.errNormal({
        error: "You cannot marry yourself!",
        type: 'editreply'
    }, interaction);

    const authorData = await Schema.findOne({ Guild: interaction.guild.id, User: author.id });
    const targetData = await Schema.findOne({ Guild: interaction.guild.id, User: target.id });

    if (authorData?.Partner || targetData?.Partner) {
        return client.errNormal({
            error: "One of you is already married!",
            type: 'editreply'
        }, interaction);
    }

    if (authorData?.Children?.includes(target.id)) {
        return client.errNormal({
            error: "You cannot marry your child!",
            type: 'editreply'
        }, interaction);
    }

    if (targetData?.Children?.includes(author.id)) {
        return client.errNormal({
            error: "You cannot marry your parent!",
            type: 'editreply'
        }, interaction);
    }

    const row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('propose_accept')
                .setLabel('Accept')
                .setStyle(Discord.ButtonStyle.Success),
            new Discord.ButtonBuilder()
                .setCustomId('propose_decline')
                .setLabel('Decline')
                .setStyle(Discord.ButtonStyle.Danger)
        );

    client.embed({
        title: `💍・Marriage Proposal`,
        desc: `${author} has proposed to ${target}. Do you accept?`,
        components: [row],
        content: `${target}`,
        type: 'editreply',
    }, interaction);

    const filter = i => i.user.id === target.id;
    interaction.channel.awaitMessageComponent({ filter, componentType: Discord.ComponentType.Button, time: 60000 })
        .then(async i => {
            if (i.customId === 'propose_accept') {
                // Update both users' Partner fields
                await Schema.findOneAndUpdate(
                    { Guild: interaction.guild.id, User: author.id },
                    { Partner: target.id },
                    { upsert: true }
                );

                await Schema.findOneAndUpdate(
                    { Guild: interaction.guild.id, User: target.id },
                    { Partner: author.id },
                    { upsert: true }
                );

                // Handle stepchildren relationships
                if (authorData?.Children?.length > 0) {
                    for (const childId of authorData.Children) {
                        // Add the child as a stepchild for the target
                        await Schema.findOneAndUpdate(
                            { Guild: interaction.guild.id, User: target.id },
                            { $addToSet: { SharedChildren: childId } }
                        );

                        // Add the target as a stepparent for the child
                        await Schema.findOneAndUpdate(
                            { Guild: interaction.guild.id, User: childId },
                            { $addToSet: { Parent: target.id } }
                        );
                    }
                }

                if (targetData?.Children?.length > 0) {
                    for (const childId of targetData.Children) {
                        // Add the child as a stepchild for the author
                        await Schema.findOneAndUpdate(
                            { Guild: interaction.guild.id, User: author.id },
                            { $addToSet: { SharedChildren: childId } }
                        );

                        // Add the author as a stepparent for the child
                        await Schema.findOneAndUpdate(
                            { Guild: interaction.guild.id, User: childId },
                            { $addToSet: { Parent: author.id } }
                        );
                    }
                }

                client.embed({
                    title: `💍・Marriage Accepted`,
                    desc: `${author} and ${target} are now married! 🎉`,
                    components: [],
                    type: 'editreply'
                }, interaction);
            } else if (i.customId === 'propose_decline') {
                client.embed({
                    title: `💔・Marriage Declined`,
                    desc: `${target} has declined the marriage proposal from ${author}.`,
                    components: [],
                    type: 'editreply'
                }, interaction);
            }
        })
        .catch(() => {
            client.embed({
                title: `⏳・Proposal Timed Out`,
                desc: `${target} did not respond to the marriage proposal.`,
                components: [],
                type: 'editreply'
            }, interaction);
        });
};

