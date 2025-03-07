const Discord = require('discord.js');

const Schema = require("../../database/models/economyTimeout");
const itemSchema = require("../../database/models/economyItems");

module.exports = async (client, interaction, args) => {
    try {
        let user = interaction.user;
        let timeout = 180000; // 3 minutes

        // Check cooldown
        const dataTime = await Schema.findOne({ Guild: interaction.guild.id, User: user.id });
        
        if (dataTime && dataTime.Beg !== null && timeout - (Date.now() - dataTime.Beg) > 0) {
            let time = (dataTime.Beg / 1000 + timeout / 1000).toFixed(0);
            return client.errWait({
                time: time,
                type: 'editreply'
            }, interaction);
        }

        // Define possible donors and their responses
        const donors = [
            { name: "Stranger", minAmount: 1, maxAmount: 10, message: "gave you some spare change" },
            { name: "Businessman", minAmount: 5, maxAmount: 25, message: "felt generous today" },
            { name: "Old Lady", minAmount: 1, maxAmount: 15, message: "gave you some money for a meal" },
            { name: "Tourist", minAmount: 5, maxAmount: 20, message: "didn't understand the currency but gave you some" },
            { name: "Streamer", minAmount: 10, maxAmount: 30, message: "gave you a donation" },
            { name: "Rich Kid", minAmount: 10, maxAmount: 50, message: "threw some money at you" }
        ];

        // Special items that can be received (5% chance)
        const specialItems = [
            { name: "Food_Coupon", value: 15, message: "also gave you a food coupon" },
            { name: "Bus_Ticket", value: 10, message: "also gave you a bus ticket" },
            { name: "Gift_Card", value: 20, message: "also gave you a small gift card" }
        ];

        // Select a random donor
        const selectedDonor = donors[Math.floor(Math.random() * donors.length)];
        
        // Calculate amount
        const amount = Math.floor(Math.random() * (selectedDonor.maxAmount - selectedDonor.minAmount + 1)) + selectedDonor.minAmount;
        
        // Update cooldown
        if (dataTime) {
            dataTime.Beg = Date.now();
            await dataTime.save();
        } else {
            await new Schema({
                Guild: interaction.guild.id,
                User: user.id,
                Beg: Date.now()
            }).save();
        }

        // Add money
        await client.addMoney(interaction, user, amount);
        
        // Prepare response fields
        const fields = [
            {
                name: `👤┆Donor`,
                value: `${selectedDonor.name}`,
                inline: true
            },
            {
                name: `${client.emotes.economy.coins}┆Amount`,
                value: `$${amount}`,
                inline: true
            }
        ];

        // 5% chance to get a special item
        if (Math.random() < 0.05) {
            const specialItem = specialItems[Math.floor(Math.random() * specialItems.length)];
            
            // Add item to inventory
            let userItems = await itemSchema.findOne({ Guild: interaction.guild.id, User: user.id });
            if (!userItems) {
                userItems = new itemSchema({
                    Guild: interaction.guild.id,
                    User: user.id
                });
            }
            
            if (!userItems.Inventory) userItems.Inventory = new Map();
            const currentAmount = userItems.Inventory.get(specialItem.name) || 0;
            userItems.Inventory.set(specialItem.name, currentAmount + 1);
            await userItems.save();
            
            // Add to response
            fields.push({
                name: `🎁┆Bonus`,
                value: `${specialItem.name.replace(/_/g, ' ')} (Value: $${specialItem.value})`,
                inline: true
            });
            
            client.succNormal({
                text: `You begged and a ${selectedDonor.name} ${selectedDonor.message} and ${specialItem.message}!`,
                fields: fields,
                type: 'editreply'
            }, interaction);
        } else {
            client.succNormal({
                text: `You begged and a ${selectedDonor.name} ${selectedDonor.message}!`,
                fields: fields,
                type: 'editreply'
            }, interaction);
        }
    } catch (error) {
        console.error("Error in beg command:", error);
        client.errNormal({ 
            error: "Something went wrong while begging!", 
            type: 'editreply' 
        }, interaction);
    }
}