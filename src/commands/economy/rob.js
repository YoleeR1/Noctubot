const Discord = require('discord.js');
const ms = require("ms");

const Schema = require("../../database/models/economy");
const Schema2 = require("../../database/models/economyTimeout");
const itemSchema = require("../../database/models/economyItems");
const professionSchema = require("../../database/models/economyProfessions");
const { formatCurrency } = require("../../assets/utils/currencyFormatter");

module.exports = async (client, interaction, args) => {
    try {
        const user = interaction.options.getUser('user');
        if (!user) return client.errUsage({ usage: "rob [mention user]", type: 'editreply' }, interaction);

        if (user.bot) return client.errNormal({
            error: "You cannot rob a bot!",
            type: 'editreply'
        }, interaction);

        if (user.id === interaction.user.id) return client.errNormal({
            error: "You cannot rob yourself!",
            type: 'editreply'
        }, interaction);

        // Check cooldown
        let timeout = 600000; // 10 minutes
        const dataTime = await Schema2.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
        
        if (dataTime && dataTime.Rob !== null && timeout - (Date.now() - dataTime.Rob) > 0) {
            let time = (dataTime.Rob / 1000 + timeout / 1000).toFixed(0);
            return client.errWait({ time: time, type: 'editreply' }, interaction);
        }

        // Get robber's data
        const authorData = await Schema.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
        if (!authorData || authorData.Money < 200) {
            return client.errNormal({ 
                error: `You need at least ${formatCurrency(200)} coins in your wallet to rob someone!`, 
                type: 'editreply' 
            }, interaction);
        }

        // Get target's data
        const targetData = await Schema.findOne({ Guild: interaction.guild.id, User: user.id });
        if (!targetData || targetData.Money <= 0) {
            return client.errNormal({ 
                error: `${user.username} does not have anything you can rob!`, 
                type: 'editreply' 
            }, interaction);
        }

        // Get profession data for bonuses
        const profData = await professionSchema.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
        const userProfession = profData ? profData.Profession : 'Unemployed';
        const userTier = profData ? profData.Tier : 1;
        
        // Update cooldown
        if (dataTime) {
            dataTime.Rob = Date.now();
            await dataTime.save();
        } else {
            await new Schema2({
                Guild: interaction.guild.id,
                User: interaction.user.id,
                Rob: Date.now()
            }).save();
        }

        // Calculate success chance based on profession and target's wealth
        let baseSuccessChance = 0.5; // 50% base chance
        
        // Profession bonus
        if (userProfession === 'Thief' || userProfession === 'Criminal') {
            baseSuccessChance += 0.1; // 10% bonus for criminal professions
            if (userTier > 1) baseSuccessChance += 0.05 * (userTier - 1); // Additional 5% per tier
        }
        
        // Target wealth factor - harder to rob rich players
        const targetWealth = targetData.Money;
        const wealthFactor = Math.min(0.3, targetWealth / 10000 * 0.1); // Up to 30% penalty for wealthy targets
        const finalSuccessChance = Math.min(0.9, Math.max(0.1, baseSuccessChance - wealthFactor));
        
        // Determine if robbery is successful
        const isSuccessful = Math.random() < finalSuccessChance;
        
        if (isSuccessful) {
            // Calculate amount to steal - between 10% and 30% of target's money
            const minSteal = Math.floor(targetWealth * 0.1);
            const maxSteal = Math.floor(targetWealth * 0.3);
            let stolenAmount = Math.floor(Math.random() * (maxSteal - minSteal + 1)) + minSteal;
            
            // Cap at target's total money
            stolenAmount = Math.min(stolenAmount, targetWealth);
            
            // Transfer the money
            await client.addMoney(interaction, interaction.user, stolenAmount);
            await client.removeMoney(interaction, user, stolenAmount);
            
            // Add experience if user has a criminal profession
            if (userProfession === 'Thief' || userProfession === 'Criminal') {
                const expGain = Math.floor(stolenAmount * 0.1); // 10% of stolen amount as XP
                if (profData) {
                    profData.Experience += expGain;
                    await profData.save();
                }
            }
            
            // 10% chance to steal an item from target's inventory
            const stealItem = Math.random() < 0.1;
            const itemFields = [];
            
            if (stealItem) {
                const targetItems = await itemSchema.findOne({ Guild: interaction.guild.id, User: user.id });
                if (targetItems && targetItems.Inventory && targetItems.Inventory.size > 0) {
                    // Convert Map to Array for random selection
                    const inventoryArray = Array.from(targetItems.Inventory.entries());
                    if (inventoryArray.length > 0) {
                        // Select random item
                        const randomIndex = Math.floor(Math.random() * inventoryArray.length);
                        const [itemKey, itemCount] = inventoryArray[randomIndex];
                        
                        // Don't steal tools, only regular items
                        if (!itemKey.startsWith('FishingRod') && !itemKey.startsWith('PickAxe') && 
                            !itemKey.startsWith('Spatula') && !itemKey.startsWith('Laptop') && 
                            !itemKey.startsWith('MedKit') && !itemKey.startsWith('Hammer')) {
                            
                            // Take one of the item
                            if (itemCount > 1) {
                                targetItems.Inventory.set(itemKey, itemCount - 1);
                            } else {
                                targetItems.Inventory.delete(itemKey);
                            }
                            await targetItems.save();
                            
                            // Add to robber's inventory
                            let robberItems = await itemSchema.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
                            if (!robberItems) {
                                robberItems = new itemSchema({
                                    Guild: interaction.guild.id,
                                    User: interaction.user.id
                                });
                            }
                            
                            if (!robberItems.Inventory) robberItems.Inventory = new Map();
                            const currentAmount = robberItems.Inventory.get(itemKey) || 0;
                            robberItems.Inventory.set(itemKey, currentAmount + 1);
                            await robberItems.save();
                            
                            // Add item field to response
                            itemFields.push({
                                name: `🎒┆Stolen Item`,
                                value: `${itemKey.replace(/_/g, ' ').replace(/^(fish|animal|stolen|collectible)_/i, '')}`,
                                inline: true
                            });
                        }
                    }
                }
            }
            
            // Success message
            const fields = [
                {
                    name: `👤┆Victim`,
                    value: `${user}`,
                    inline: true
                },
                {
                    name: `${client.emotes.economy.coins}┆Stolen`,
                    value: `$${formatCurrency(stolenAmount)}`,
                    inline: true
                }
            ];
            
            // Add item field if an item was stolen
            fields.push(...itemFields);
            
            // Add XP field if applicable
            if (userProfession === 'Thief' || userProfession === 'Criminal') {
                fields.push({
                    name: `⭐┆Experience`,
                    value: `+${formatCurrency(Math.floor(stolenAmount * 0.1))} XP`,
                    inline: true
                });
            }
            
            client.succNormal({
                text: `Your robbery was successful!`,
                fields: fields,
                type: 'editreply'
            }, interaction);
        } else {
            // Failed robbery
            // Calculate fine - between 10% and 30% of robber's money
            const robberWealth = authorData.Money;
            const minFine = Math.floor(robberWealth * 0.1);
            const maxFine = Math.floor(robberWealth * 0.3);
            let fine = Math.floor(Math.random() * (maxFine - minFine + 1)) + minFine;
            
            // Cap at robber's total money
            fine = Math.min(fine, robberWealth);
            
            // Remove the fine
            await client.removeMoney(interaction, interaction.user, fine);
            
            client.errNormal({ 
                error: `You were caught trying to rob ${user.username} and had to pay a fine of $${formatCurrency(fine)}!`, 
                type: 'editreply' 
            }, interaction);
        }
    } catch (error) {
        console.error("Error in rob command:", error);
        client.errNormal({ 
            error: "Something went wrong while attempting the robbery!", 
            type: 'editreply' 
        }, interaction);
    }
}