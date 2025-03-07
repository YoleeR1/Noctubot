const Discord = require('discord.js');
const ms = require("ms");

const Schema = require("../../database/models/economy");
const Schema2 = require("../../database/models/economyTimeout");
const itemSchema = require("../../database/models/economyItems");

module.exports = async (client, interaction, args) => {

    const rand = (min, max) => {
        return Math.floor(Math.random() * (max - min)) + min;
    };

    let user = interaction.user;

    let timeout = 60000;
    // Fish with their values
    let fishItems = [
        { name: "Yellow Fish", emoji: ":tropical_fish:", value: 10 },
        { name: "Fat Fish", emoji: ":blowfish:", value: 15 },
        { name: "Blue Fish", emoji: ":fish:", value: 10 },
        { name: "Coconut", emoji: ":coconut:", value: 20 },
        { name: "Dolphin", emoji: ":dolphin:", value: 35 },
        { name: "Lobster", emoji: ":lobster:", value: 30 },
        { name: "Shark", emoji: ":shark:", value: 50 },
        { name: "Crab", emoji: ":crab:", value: 20 },
        { name: "Squid", emoji: ":squid:", value: 25 },
        { name: "Whale", emoji: ":whale2:", value: 75 },
        { name: "Shrimp", emoji: ":shrimp:", value: 15 },
        { name: "Octopus", emoji: ":octopus:", value: 30 },
        { name: "Diamond", emoji: ":gem:", value: 100 }
    ];

    let randn = rand(0, parseInt(fishItems.length));
    let randrod = rand(15, 30);

    let fishCaught = fishItems[randn];
    let fishToWin = `${fishCaught.name} ${fishCaught.emoji} ($${fishCaught.value})`;

    const userItems = await itemSchema.findOne({ Guild: interaction.guild.id, User: user.id });

    if (!userItems || userItems.FishingRod == false) return client.errNormal({ error: "You have to buy a fishing rod!", type: 'editreply' }, interaction);

    if (userItems) {
        if (userItems.FishingRodUsage >= randrod) {
            userItems.FishingRod = false;
            userItems.save();

            return client.errNormal({ error: "Your fishing rod has broken! Go buy a new one!", type: 'editreply' }, interaction);
        }
    }

    Schema2.findOne({ Guild: interaction.guild.id, User: user.id }, async (err, dataTime) => {
        if (dataTime && dataTime.Fish !== null && timeout - (Date.now() - dataTime.Fish) > 0) {
            let time = (dataTime.Fish / 1000 + timeout / 1000).toFixed(0);

            return client.errWait({ time: time, type: 'editreply' }, interaction);
        }
        else {
            // Add fish to inventory
            if (userItems) {
                // Increment fishing rod usage
                userItems.FishingRodUsage += 1;
                
                // Add fish to inventory
                const fishKey = `fish_${fishCaught.name.replace(/\s+/g, '_')}`;
                if (!userItems.Inventory) userItems.Inventory = new Map();
                
                const currentAmount = userItems.Inventory.get(fishKey) || 0;
                userItems.Inventory.set(fishKey, currentAmount + 1);
                
                await userItems.save();
            }

            client.succNormal({ 
                text: `You've fished and caught a ${fishToWin}!\nIt has been added to your inventory.`, 
                type: 'editreply' 
            }, interaction);

            if (dataTime) {
                dataTime.Fish = Date.now();
                dataTime.save();
            }
            else {
                new Schema2({
                    Guild: interaction.guild.id,
                    User: user.id,
                    Fish: Date.now()
                }).save();
            }
        }
    })

}

 