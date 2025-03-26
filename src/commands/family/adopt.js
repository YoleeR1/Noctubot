const Discord = require('discord.js');
const Schema = require("../../database/models/family");

module.exports = async (client, interaction, args) => {
    const target = interaction.options.getUser('user');
    const author = interaction.user;

    if (author.id === target.id) return client.errNormal({
        error: "You cannot adopt yourself.",
        type: 'editreply'
    }, interaction);

    if (target.bot) return client.errNormal({
        error: "You cannot adopt a bot.",
        type: 'editreply'
    }, interaction);

    const authorData = await Schema.findOne({ Guild: interaction.guild.id, User: author.id });

    if (authorData?.Partner === target.id) {
        return client.errNormal({
            error: "You cannot adopt your partner.",
            type: 'editreply'
        }, interaction);
    }

    const existingRelationship = await Schema.findOne({
        Guild: interaction.guild.id,
        User: target.id,
        Parent: author.id
    });

    if (existingRelationship) {
        return client.errNormal({
            error: "This user is already part of your family.",
            type: 'editreply'
        }, interaction);
    }

    const row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('adopt_accept')
                .setLabel('Accept')
                .setStyle(Discord.ButtonStyle.Success),
            new Discord.ButtonBuilder()
                .setCustomId('adopt_decline')
                .setLabel('Decline')
                .setStyle(Discord.ButtonStyle.Danger)
        );

    client.embed({
        title: `👪・Adoption Request`,
        desc: `${author} wants to adopt you, ${target}. Do you accept?`,
        components: [row],
        content: `${target}`,
        type: 'editreply',
    }, interaction);

    const filter = i => i.user.id === target.id;
    interaction.channel.awaitMessageComponent({ filter, componentType: Discord.ComponentType.Button, time: 60000 })
        .then(async i => {
            if (i.customId === 'adopt_accept') {
                const authorData = await Schema.findOneAndUpdate(
                    { Guild: interaction.guild.id, User: author.id },
                    { $addToSet: { Children: target.id } },
                    { upsert: true, new: true }
                );

                if (authorData.Partner) {
                    // Add the child as a "Step Child" for the partner
                    await Schema.findOneAndUpdate(
                        { Guild: interaction.guild.id, User: authorData.Partner },
                        { $addToSet: { SharedChildren: target.id } },
                        { upsert: true }
                    );

                    // Add the partner as a "Step Parent" for the child
                    await Schema.findOneAndUpdate(
                        { Guild: interaction.guild.id, User: target.id },
                        { $addToSet: { Parent: authorData.Partner } },
                        { upsert: true }
                    );
                }

                await Schema.findOneAndUpdate(
                    { Guild: interaction.guild.id, User: target.id },
                    { $addToSet: { Parent: author.id } },
                    { upsert: true }
                );

                client.embed({
                    title: `👪・Adoption Successful`,
                    desc: `${author} has adopted ${target}.`,
                    components: [],
                    type: 'editreply'
                }, interaction);
            } else if (i.customId === 'adopt_decline') {
                client.embed({
                    title: `👪・Adoption Declined`,
                    desc: `${target} has declined the adoption request from ${author}.`,
                    components: [],
                    type: 'editreply'
                }, interaction);
            }
        })
        .catch(() => {
            client.embed({
                title: `👪・Adoption Timed Out`,
                desc: `${target} did not respond to the adoption request.`,
                components: [],
                type: 'editreply'
            }, interaction);
        });
};


