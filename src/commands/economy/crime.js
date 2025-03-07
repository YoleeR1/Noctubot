const Discord = require('discord.js');

const Schema = require("../../database/models/economy");
const Schema2 = require("../../database/models/economyTimeout");
const itemSchema = require("../../database/models/economyItems");
const professionSchema = require("../../database/models/economyProfessions");

module.exports = async (client, interaction, args) => {
    try {
        let user = interaction.user;
        let timeout = 600000; // 10 minutes

        // Define crimes with varying difficulty, rewards, and potential stolen items
        const crimes = [
            { 
                name: "Pickpocketing", 
                difficulty: 0.4, // 40% success rate
                minReward: 10, 
                maxReward: 50,
                stolenItems: [
                    { name: "Wallet", value: 15, chance: 0.7 },
                    { name: "Watch", value: 30, chance: 0.3 }
                ],
                fine: 20
            },
            { 
                name: "Shoplifting", 
                difficulty: 0.5, 
                minReward: 20, 
                maxReward: 70,
                stolenItems: [
                    { name: "Electronics", value: 40, chance: 0.5 },
                    { name: "Clothing", value: 25, chance: 0.8 }
                ],
                fine: 40
            },
            { 
                name: "Burglary", 
                difficulty: 0.6, 
                minReward: 50, 
                maxReward: 150,
                stolenItems: [
                    { name: "Jewelry", value: 80, chance: 0.4 },
                    { name: "Antique", value: 100, chance: 0.2 }
                ],
                fine: 100
            },
            { 
                name: "Hacking", 
                difficulty: 0.7, 
                minReward: 100, 
                maxReward: 300,
                stolenItems: [
                    { name: "Data", value: 120, chance: 0.3 },
                    { name: "Cryptocurrency", value: 200, chance: 0.1 }
                ],
                fine: 200
            },
            { 
                name: "Bank Heist", 
                difficulty: 0.8, 
                minReward: 200, 
                maxReward: 500,
                stolenItems: [
                    { name: "Gold_Bar", value: 300, chance: 0.2 },
                    { name: "Diamonds", value: 400, chance: 0.1 }
                ],
                fine: 400
            }
        ];

        // Check cooldown
        const dataTime = await Schema2.findOne({ Guild: interaction.guild.id, User: user.id });
        
        if (dataTime && dataTime.Crime !== null && timeout - (Date.now() - dataTime.Crime) > 0) {
            let time = (dataTime.Crime / 1000 + timeout / 1000).toFixed(0);
            return client.errWait({
                time: time,
                type: 'editreply'
            }, interaction);
        }

        // Get user's profession data for bonus
        const profData = await professionSchema.findOne({ Guild: interaction.guild.id, User: user.id });
        const userProfession = profData ? profData.Profession : 'Unemployed';
        const userTier = profData ? profData.Tier : 1;
        
        // Programmers get bonus for hacking, higher tiers get general bonus
        let successBonus = 0;
        if (userProfession === 'Programmer') {
            successBonus += 0.1; // 10% bonus
            if (userTier > 1) successBonus += 0.05 * (userTier - 1); // Additional 5% per tier above 1
        } else if (userTier > 1) {
            successBonus += 0.03 * (userTier - 1); // 3% bonus per tier for other professions
        }

        // Select a random crime
        const selectedCrime = crimes[Math.floor(Math.random() * crimes.length)];
        
        // Calculate success chance
        const successChance = selectedCrime.difficulty - successBonus;
        const isSuccessful = Math.random() > successChance;

        // Update cooldown
        if (dataTime) {
            dataTime.Crime = Date.now();
            await dataTime.save();
        } else {
            await new Schema2({
                Guild: interaction.guild.id,
                User: user.id,
                Crime: Date.now()
            }).save();
        }

        if (isSuccessful) {
            // Calculate reward
            const baseReward = Math.floor(Math.random() * (selectedCrime.maxReward - selectedCrime.minReward + 1)) + selectedCrime.minReward;
            const tierBonus = userTier > 1 ? (userTier - 1) * 0.2 : 0; // 20% bonus per tier above 1
            const finalReward = Math.floor(baseReward * (1 + tierBonus));
            
            // Add money
            await client.addMoney(interaction, user, finalReward);
            
            // Get or create user items
            let userItems = await itemSchema.findOne({ Guild: interaction.guild.id, User: user.id });
            if (!userItems) {
                userItems = new itemSchema({
                    Guild: interaction.guild.id,
                    User: user.id
                });
            }
            
            // Determine if user gets a stolen item
            const stolenItemFields = [];
            for (const potentialItem of selectedCrime.stolenItems) {
                if (Math.random() < potentialItem.chance) {
                    // Add item to inventory
                    const itemKey = `stolen_${potentialItem.name.replace(/\s+/g, '_')}`;
                    if (!userItems.Inventory) userItems.Inventory = new Map();
                    
                    const currentAmount = userItems.Inventory.get(itemKey) || 0;
                    userItems.Inventory.set(itemKey, currentAmount + 1);
                    
                    stolenItemFields.push({
                        name: `💰┆Stolen Item`,
                        value: `${potentialItem.name} (Value: $${potentialItem.value})`,
                        inline: true
                    });
                }
            }
            
            await userItems.save();
            
            // Success message
            const fields = [
                {
                    name: `🦹‍♂️┆Crime`,
                    value: `${selectedCrime.name}`,
                    inline: true
                },
                {
                    name: `${client.emotes.economy.coins}┆Earned`,
                    value: `$${finalReward}`,
                    inline: true
                }
            ];
            
            // Add stolen items to message if any
            fields.push(...stolenItemFields);
            
            client.succNormal({
                text: `Your crime went successfully!`,
                fields: fields,
                type: 'editreply'
            }, interaction);
        } else {
            // Calculate fine
            const baseFine = selectedCrime.fine;
            const tierReduction = userTier > 1 ? (userTier - 1) * 0.1 : 0; // 10% reduction per tier above 1
            const finalFine = Math.floor(baseFine * (1 - tierReduction));
            
            // Remove money (if user has enough)
            const userData = await Schema.findOne({ Guild: interaction.guild.id, User: user.id });
            const userMoney = userData ? userData.Money : 0;
            
            const actualFine = Math.min(finalFine, userMoney);
            if (actualFine > 0) {
                await client.removeMoney(interaction, user, actualFine);
            }
            
            client.errNormal({ 
                error: `You were caught attempting ${selectedCrime.name}! You paid a fine of $${actualFine}.`, 
                type: 'editreply' 
            }, interaction);
        }
    } catch (error) {
        console.error("Error in crime command:", error);
        client.errNormal({ 
            error: "Something went wrong while committing the crime!", 
            type: 'editreply' 
        }, interaction);
    }
}