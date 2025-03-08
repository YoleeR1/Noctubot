const Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    let row = new Discord.ActionRowBuilder()
        .addComponents(
            new Discord.ButtonBuilder()
                .setLabel("Donate")
                .setURL("https://paypal.me/NocturnalsBusiness")
                .setStyle(Discord.ButtonStyle.Link),
        );
    
    client.embed({
        title: `${client.user.username}・Donate`,
        desc: 'Click the button below to support the server!\n**All money goes back to the server e.g for giveaways**',
        thumbnail: client.user.avatarURL({ dynamic: true }),
        url: "https://paypal.me/NocturnalsBusiness",
        components: [row],
        type: 'editreply'
    }, interaction)
}