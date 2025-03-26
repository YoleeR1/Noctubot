const Discord = require('discord.js');
const Schema = require("../../database/models/family");

module.exports = async (client, interaction, args) => {
    const target = interaction.options.getUser('user') || interaction.user;

    const data = await Schema.findOne({ Guild: interaction.guild.id, User: target.id });

    const uniqueChildren = new Set([
        ...data?.Children || [],
        ...data?.SharedChildren || []
    ]);

    // Fetch parent data asynchronously
    const parentDataPromises = data?.Parent.map(async (parentId) => {
        const parentData = await Schema.findOne({ Guild: interaction.guild.id, User: parentId });
        const isLegalParent = parentData?.Children.includes(target.id);
        return `<@${parentId}> (${isLegalParent ? "Legal Parent" : "Step Parent"})`;
    }) || [];
    const parentData = await Promise.all(parentDataPromises);

    client.embed({
        title: `👪・${target.username}'s Family`,
        thumbnail: target.avatarURL({ size: 1024 }),
        fields: [
            {
                name: `Partner`,
                value: `${data && data.Partner ? `<@${data.Partner}>` : `This user is not married.`}`
            },
            {
                name: `Parents`,
                value: `${parentData.length > 0 ? parentData.join(", ") : `This user has no parents.`}`
            },
            {
                name: `Children`,
                value: `${uniqueChildren.size > 0 
                    ? Array.from(uniqueChildren).map(child => {
                        const isLegalChild = data.Children.includes(child);
                        return `<@${child}> (${isLegalChild ? "Legal Child" : "Step Child"})`;
                    }).join(", ")
                    : `This user has no children.`}`
            }
        ],
        type: 'editreply'
    }, interaction);
};

