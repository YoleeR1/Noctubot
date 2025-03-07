const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    let row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setLabel("")
                .setURL("")
                .setStyle(Discord.ButtonStyle.Link),
        );

    client.embed({
        title: `${client.user.username}・Donate`,
        desc: '_____ \n\nClick the button below to support the server!\n**All money goes back to the server like giveaway and such**',
        thumbnail: client.user.avatarURL({ dynamic: true }),
        url: "paypal.me/NocturnalsBusiness",
        components: [row],
        type: 'editreply'
    }, interaction)
}

 
