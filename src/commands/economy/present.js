const Discord = require('discord.js');

const Schema = require("../../database/models/economy");
const Schema2 = require("../../database/models/economyTimeout");
const itemSchema = require("../../database/models/economyItems");
const professionSchema = require("../../database/models/economyProfessions");

module.exports = async (client, interaction, args) => {
    try {
        let user = interaction.user;
        let timeout = 604800000; // 7 days

        // Check cooldown
        const dataTime = await Schema2.findOne({ Guild: interaction.guild.id, User: user.id });
        
        if (dataTime && dataTime.Present !== null && timeout - (Date.now() - dataTime.Present) > 0) {
            let time = (dataTime.Present / 1000 + timeout / 1000).toFixed(0);
            return client.errWait({
                time: time,
                type: 'editreply'
            }, interaction);
        }

        // Get profession data for bonuses
        const profData = await professionSchema.findOne({ Guild: interaction.guild.id, User: user.id });
        const userProfession = profData ? profData.Profession : 'Unemployed';
        const userTier = profData ? profData.Tier : 1;
        
        // Update cooldown
        if (dataTime) {
            dataTime.Present = Date.now();
            await dataTime.save();
        } else {
            await new Schema2({
                Guild: interaction.guild.id,
                User: user.id,
                Present: Date.now()
            }).save();
        }

        // Check if it's a holiday for bonus rewards
        const today = new Date();
        const month = today.getMonth() + 1; // January is 0
        const day = today.getDate();
        
        let isHoliday = false;
        let holidayName = "";
        
        // Check for holidays
        if ((month === 12 && day >= 24 && day <= 26)) {
            isHoliday = true;
            holidayName = "Christmas";
        } else if ((month === 12 && day === 31) || (month === 1 && day === 1)) {
            isHoliday = true;
            holidayName = "New Year";
        } else if (month === 2 && day === 14) {
            isHoliday = true;
            holidayName = "Valentine's Day";
        } else if (month === 10 && day === 31) {
            isHoliday = true;
            holidayName = "Halloween";
        }
        
        // Determine reward type
        // 70% chance for money, 25% chance for items, 5% chance for rare collectible
        const rewardType = Math.random();
        const fields = [];
        let rewardText = "You've collected your weekly present!";
        
        if (isHoliday) {
            rewardText = `🎉 Happy ${holidayName}! You've collected a special holiday present!`;
        }
        
        // Money reward (70% chance or if holiday)
        if (rewardType < 0.7 || isHoliday) {
            // Base amount
            let baseAmount = Math.floor(Math.random() * 1000) + 1;
            
            // Profession bonus
            let professionBonus = 1.0; // No bonus by default
            if (userProfession !== 'Unemployed') {
                professionBonus += 0.1; // 10% bonus for having a profession
                professionBonus += (userTier - 1) * 0.1; // Additional 10% per tier
            }
            
            // Holiday bonus
            let holidayBonus = isHoliday ? 2.0 : 1.0; // Double rewards on holidays
            
            // Calculate final amount
            let amount = Math.floor(baseAmount * professionBonus * holidayBonus);
            
            // Add money
            await client.addMoney(interaction, user, amount);
            
            fields.push({
                name: `${client.emotes.economy.coins}┆Money Reward`,
                value: `$${amount}`,
                inline: true
            });
            
            // Add profession bonus info if applicable
            if (professionBonus > 1.0) {
                fields.push({
                    name: `👔┆Profession Bonus`,
                    value: `+${Math.floor((professionBonus - 1) * 100)}%`,
                    inline: true
                });
            }
            
            // Add holiday bonus info if applicable
            if (isHoliday) {
                fields.push({
                    name: `🎊┆Holiday Bonus`,
                    value: `+100% (${holidayName})`,
                    inline: true
                });
            }
        }
        
        // Item reward (25% chance or if holiday)
        if (rewardType >= 0.7 && rewardType < 0.95 || isHoliday) {
            // Define possible items
            const items = [
                { name: "Gift_Box", value: 50, chance: 0.3 },
                { name: "Mystery_Package", value: 75, chance: 0.25 },
                { name: "Lucky_Coin", value: 100, chance: 0.2 },
                { name: "Treasure_Map", value: 150, chance: 0.15 },
                { name: "Ancient_Relic", value: 200, chance: 0.1 }
            ];
            
            // Profession-specific items
            const professionItems = {
                'Fisherman': { name: "Special_Bait", value: 120, chance: 0.5 },
                'Miner': { name: "Mining_Map", value: 120, chance: 0.5 },
                'Chef': { name: "Rare_Spice", value: 120, chance: 0.5 },
                'Programmer': { name: "Code_Snippet", value: 120, chance: 0.5 },
                'Doctor': { name: "Medical_Journal", value: 120, chance: 0.5 },
                'Builder': { name: "Blueprint", value: 120, chance: 0.5 }
            };
            
            // Add profession-specific item if applicable
            if (userProfession !== 'Unemployed' && professionItems[userProfession]) {
                items.push(professionItems[userProfession]);
            }
            
            // Select items to give (1-3 items)
            const itemCount = isHoliday ? 3 : Math.floor(Math.random() * 2) + 1;
            const givenItems = [];
            
            for (let i = 0; i < itemCount; i++) {
                // Weight selection by chance
                let totalChance = 0;
                for (const item of items) {
                    totalChance += item.chance;
                }
                
                let random = Math.random() * totalChance;
                let selectedItem = null;
                
                for (const item of items) {
                    random -= item.chance;
                    if (random <= 0) {
                        selectedItem = item;
                        break;
                    }
                }
                
                if (selectedItem) {
                    givenItems.push(selectedItem);
                    
                    // Remove item from pool to prevent duplicates
                    const index = items.findIndex(i => i.name === selectedItem.name);
                    if (index > -1) {
                        items.splice(index, 1);
                    }
                }
            }
            
            // Add items to inventory
            if (givenItems.length > 0) {
                let userItems = await itemSchema.findOne({ Guild: interaction.guild.id, User: user.id });
                if (!userItems) {
                    userItems = new itemSchema({
                        Guild: interaction.guild.id,
                        User: user.id
                    });
                }
                
                if (!userItems.Inventory) userItems.Inventory = new Map();
                
                for (const item of givenItems) {
                    const currentAmount = userItems.Inventory.get(item.name) || 0;
                    userItems.Inventory.set(item.name, currentAmount + 1);
                    
                    fields.push({
                        name: `🎁┆Item Reward`,
                        value: `${item.name.replace(/_/g, ' ')} (Value: $${item.value})`,
                        inline: true
                    });
                }
                
                await userItems.save();
            }
        }
        
        // Rare collectible (5% chance or if holiday)
        if ((rewardType >= 0.95 || isHoliday) && fields.length < 6) {
            const collectibles = [
                { name: "Limited_Edition_Trophy", value: 500 },
                { name: "Commemorative_Medal", value: 750 },
                { name: "Rare_Artifact", value: 1000 },
                { name: "Legendary_Relic", value: 1500 },
                { name: "Mythical_Treasure", value: 2000 }
            ];
            
            // Holiday-specific collectibles
            if (isHoliday) {
                if (holidayName === "Christmas") {
                    collectibles.push({ name: "Christmas_Star", value: 2500 });
                    collectibles.push({ name: "Santa_Hat", value: 2000 });
                } else if (holidayName === "New Year") {
                    collectibles.push({ name: "New_Year_Firework", value: 2500 });
                    collectibles.push({ name: "Celebration_Champagne", value: 2000 });
                } else if (holidayName === "Valentine's Day") {
                    collectibles.push({ name: "Heart_Locket", value: 2500 });
                    collectibles.push({ name: "Love_Letter", value: 2000 });
                } else if (holidayName === "Halloween") {
                    collectibles.push({ name: "Spooky_Pumpkin", value: 2500 });
                    collectibles.push({ name: "Witch_Hat", value: 2000 });
                }
            }
            
            // Select a random collectible
            const selectedCollectible = collectibles[Math.floor(Math.random() * collectibles.length)];
            
            // Add to inventory
            let userItems = await itemSchema.findOne({ Guild: interaction.guild.id, User: user.id });
            if (!userItems) {
                userItems = new itemSchema({
                    Guild: interaction.guild.id,
                    User: user.id
                });
            }
            
            if (!userItems.Inventory) userItems.Inventory = new Map();
            const currentAmount = userItems.Inventory.get(`collectible_${selectedCollectible.name}`) || 0;
            userItems.Inventory.set(`collectible_${selectedCollectible.name}`, currentAmount + 1);
            await userItems.save();
            
            fields.push({
                name: `💎┆Rare Collectible`,
                value: `${selectedCollectible.name.replace(/_/g, ' ')} (Value: $${selectedCollectible.value})`,
                inline: true
            });
        }
        
        // Add experience if user has a profession
        if (userProfession !== 'Unemployed' && profData) {
            const expGain = Math.floor(Math.random() * 50) + 50; // 50-100 XP
            profData.Experience += expGain;
            await profData.save();
            
            fields.push({
                name: `⭐┆Experience`,
                value: `+${expGain} XP`,
                inline: true
            });
        }
        
        // Send success message
        client.succNormal({
            text: rewardText,
            fields: fields,
            type: 'editreply'
        }, interaction);
        
    } catch (error) {
        console.error("Error in present command:", error);
        client.errNormal({ 
            error: "Something went wrong while collecting your present!", 
            type: 'editreply' 
        }, interaction);
    }
}