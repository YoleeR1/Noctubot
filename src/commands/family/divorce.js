const Discord = require('discord.js');
const Schema = require("../../database/models/family");

module.exports = async (client, interaction, args) => {
    const target = interaction.options.getUser('user');
    const author = interaction.user;

    if (author.id === target.id) return client.errNormal({
        error: "You cannot divorce yourself.",
        type: 'editreply'
    }, interaction);

    if (target.bot) return client.errNormal({
        error: "You cannot divorce a bot.",
        type: 'editreply'
    }, interaction);

    const data = await Schema.findOne({ Guild: interaction.guild.id, User: author.id, Partner: target.id });
    if (data) {
        const partnerData = await Schema.findOne({ Guild: interaction.guild.id, User: target.id });

        if (partnerData) {
            // Remove stepchildren from the partner's SharedChildren list
            for (const childId of data.Children) {
                await Schema.findOneAndUpdate(
                    { Guild: interaction.guild.id, User: target.id },
                    { $pull: { SharedChildren: childId } }
                );

                // Remove the partner as a stepparent from the children's Parent list
                await Schema.findOneAndUpdate(
                    { Guild: interaction.guild.id, User: childId },
                    { $pull: { Parent: target.id } }
                );
            }

            // Clear the partner's Partner field
            partnerData.Partner = null;
            await partnerData.save();
        }

        // Clear the user's Partner field
        data.Partner = null;
        await data.save();

        client.embed({
            title: `👰・Divorced`,
            desc: `${author} and ${target} are no longer married.`,
            type: 'editreply'
        }, interaction);
    } else {
        client.errNormal({
            error: "You are not married to this user.",
            type: 'editreply'
        }, interaction);
    }
};

