const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    client.embed({
        title: `📘・Owner information`,
        desc: `____________________________`,
        thumbnail: client.user.avatarURL({ dynamic: true, size: 1024 }),
        fields: [{
            name: "👑┆Owner name",
            value: `YoleeR`,
            inline: true,
        },
        {
            name: "🏷┆Discord tag",
            value: `yoleer`,
            inline: true,
        },
        {
            name: "🏢┆Organization",
            value: `Nocturnals INC`,
            inline: true,
        },
        {
            name: "🌐┆Website",
            value: `(https://babyboos.eu)`,
            inline: true,
        }],
        type: 'editreply'
    }, interaction)
}

 
