const Discord = require('discord.js');
const Schema = require("../../database/models/family");

module.exports = async (client, interaction, args) => {
    const target = interaction.options.getUser('user');
    const author = interaction.user;

    if (author.id === target.id) return client.errNormal({
        error: "You cannot disown yourself.",
        type: 'editreply'
    }, interaction);

    if (target.bot) return client.errNormal({
        error: "You cannot disown a bot.",
        type: 'editreply'
    }, interaction);

    const authorData = await Schema.findOne({ Guild: interaction.guild.id, User: author.id });
    if (!authorData || !authorData.Children.includes(target.id)) {
        return client.errNormal({
            error: "This user is not your child.",
            type: 'editreply'
        }, interaction);
    }

    authorData.Children = authorData.Children.filter(child => child !== target.id);
    await authorData.save();

    if (authorData.Partner) {
        const partnerData = await Schema.findOne({ Guild: interaction.guild.id, User: authorData.Partner });
        if (partnerData && partnerData.SharedChildren.includes(target.id)) {
            partnerData.SharedChildren = partnerData.SharedChildren.filter(child => child !== target.id);
            await partnerData.save();
        }
    }

    const targetData = await Schema.findOne({ Guild: interaction.guild.id, User: target.id });
    if (targetData) {
        targetData.Parent = targetData.Parent.filter(parent => parent !== author.id);
        await targetData.save();
    }

    client.embed({
        title: `👪・Disowned`,
        desc: `${author} has disowned ${target}.`,
        type: 'editreply'
    }, interaction);
};

