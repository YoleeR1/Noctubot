const slotItems = ["🍇", "🍉", "🍊", "🍎", "🍓", "🍒"];
const Discord = require('discord.js');
const ms = require("parse-ms");

const Schema = require("../../database/models/economy");
const { formatCurrency, parseCurrency } = require("../../assets/utils/currencyFormatter");

module.exports = async (client, interaction, args) => {
    let user = interaction.user;

    Schema.findOne({ Guild: interaction.guild.id, User: user.id }, async (err, data) => {
        if (data) {
            let money = parseCurrency(interaction.options.getString('amount'));
            let win = false;

            if (!money) return client.errUsage({ usage: "slots [amount]", type: 'editreply' }, interaction);
            if (money > data.Money) return client.errNormal({ error: `You are betting more than you have!`, type: 'editreply' }, interaction);

            let number = []
            for (i = 0; i < 3; i++) { number[i] = Math.floor(Math.random() * slotItems.length); }

            if (number[0] == number[1] && number[1] == number[2]) {
                money *= 7 // Reduced from 9x to 7x for all three matching
                win = true;
            } else if (number[0] == number[1] || number[0] == number[2] || number[1] == number[2]) {
                money *= 1.5 // Reduced from 2x to 1.5x for two matching
                win = true;
            }

            const row = new Discord.ActionRowBuilder()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('slots_1')
                        .setLabel(`${slotItems[number[0]]}`)
                        .setStyle(Discord.ButtonStyle.Primary),

                    new Discord.ButtonBuilder()
                        .setCustomId('slots_2')
                        .setLabel(`${slotItems[number[1]]}`)
                        .setStyle(Discord.ButtonStyle.Primary),

                    new Discord.ButtonBuilder()
                        .setCustomId('slots_3')
                        .setLabel(`${slotItems[number[2]]}`)
                        .setStyle(Discord.ButtonStyle.Primary),
                );
            if (win) {

                client.embed({
                    title: `🎰・Slots`,
                    desc: `You won **${client.emotes.economy.coins} $${formatCurrency(money)}**`,
                    color: client.config.colors.succes, 
                    components: [row], 
                    type: 'editreply'
                }, interaction)

                data.Money += money;
                data.save();
            } else {

                client.embed({
                    title: `🎰・Slots`,
                    desc: `You lost **${client.emotes.economy.coins} $${formatCurrency(money)}**`,
                    components: [row], 
                    color: client.config.colors.error, 
                    type: 'editreply'
                }, interaction)

                data.Money -= money;
                data.save();
            }
        }
        else {
            client.errNormal({ error: `You has no ${client.emotes.economy.coins}!`, type: 'editreply' }, interaction);
        }
    })
}