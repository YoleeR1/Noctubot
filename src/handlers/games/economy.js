const Discord = require('discord.js');

const Schema = require("../../database/models/economy");
const itemSchema = require("../../database/models/economyItems");
const professionSchema = require("../../database/models/economyProfessions");
const storeSchema = require("../../database/models/economyStore");
const statsSchema = require("../../database/models/economyStats");

module.exports = async (client) => {
    // Money management functions
    client.addMoney = async function (interaction, user, amount) {
        try {
            let data = await Schema.findOne({ Guild: interaction.guild.id, User: user.id });
            
            if (data) {
                data.Money += amount;
                await data.save();
            }
            else {
                data = new Schema({
                    Guild: interaction.guild.id,
                    User: user.id,
                    Money: amount,
                    Bank: 0
                });
                await data.save();
            }
            
            // Update economy stats for inflation
            await updateEconomyStats(interaction.guild.id, amount, 0);
        } catch (error) {
            console.error(`[Economy] Error adding money:`, error);
        }
    }

    client.removeMoney = async function (interaction, user, amount) {
        try {
            const data = await Schema.findOne({ Guild: interaction.guild.id, User: user.id });
            
            if (data) {
                data.Money -= amount;
                await data.save();
                
                // Update economy stats for inflation
                await updateEconomyStats(interaction.guild.id, -amount, 0);
            }
            else {
                client.errNormal({ error: `User has no ${client.emotes.economy.coins}!`, type: 'editreply' }, interaction);
            }
        } catch (error) {
            console.error(`[Economy] Error removing money:`, error);
        }
    }
    
    client.addBank = async function (interaction, user, amount) {
        try {
            let data = await Schema.findOne({ Guild: interaction.guild.id, User: user.id });
            
            if (data) {
                data.Bank += amount;
                await data.save();
            }
            else {
                data = new Schema({
                    Guild: interaction.guild.id,
                    User: user.id,
                    Money: 0,
                    Bank: amount
                });
                await data.save();
            }
            
            // Update economy stats for inflation
            await updateEconomyStats(interaction.guild.id, 0, amount);
        } catch (error) {
            console.error(`[Economy] Error adding to bank:`, error);
        }
    }
    
    client.removeBank = async function (interaction, user, amount) {
        try {
            const data = await Schema.findOne({ Guild: interaction.guild.id, User: user.id });
            
            if (data) {
                data.Bank -= amount;
                await data.save();
                
                // Update economy stats for inflation
                await updateEconomyStats(interaction.guild.id, 0, -amount);
            }
            else {
                client.errNormal({ error: `User has no ${client.emotes.economy.coins} in the bank!`, type: 'editreply' }, interaction);
            }
        } catch (error) {
            console.error(`[Economy] Error removing from bank:`, error);
        }
    }

    // Item management
    client.buyItem = async function (interaction, user, itemName) {
        try {
            let data = await itemSchema.findOne({ Guild: interaction.guild.id, User: user.id });
            let newItem = false;
            
            if (!data) {
                data = new itemSchema({
                    Guild: interaction.guild.id,
                    User: user.id
                });
                newItem = true;
            }
            
            switch(itemName) {
                case "FishingRod":
                    data.FishingRod = true;
                    data.FishingRodUsage = 0;
                    data.FishingRodTier = 1;
                    break;
                    
                case "PickAxe":
                    data.PickAxe = true;
                    data.PickAxeUsage = 0;
                    data.PickAxeTier = 1;
                    break;
                    
                case "Laptop":
                    data.Laptop = true;
                    data.LaptopUsage = 0;
                    data.LaptopTier = 1;
                    break;
                    
                case "Spatula":
                    data.Spatula = true;
                    data.SpatulaUsage = 0;
                    data.SpatulaTier = 1;
                    break;
                    
                case "MedKit":
                    data.MedKit = true;
                    data.MedKitUsage = 0;
                    data.MedKitTier = 1;
                    break;
                    
                case "Hammer":
                    data.Hammer = true;
                    data.HammerUsage = 0;
                    data.HammerTier = 1;
                    break;
                    
                default:
                    // Handle inventory items
                    const inventory = data.Inventory || new Map();
                    const currentAmount = inventory.get(itemName) || 0;
                    inventory.set(itemName, currentAmount + 1);
                    data.Inventory = inventory;
                    break;
            }
            
            await data.save();
            
            // Update economy stats
            try {
                let statsData = await statsSchema.findOne({ Guild: interaction.guild.id });
                if (statsData) {
                    statsData.TotalItemsPurchased += 1;
                    await statsData.save();
                }
            } catch (error) {
                console.error(`[Economy] Error updating item purchase stats:`, error);
            }
            
            return true;
        } catch (error) {
            console.error(`[Economy] Error buying item:`, error);
            return false;
        }
    }
    
    // Profession management
    client.chooseProfession = async function (interaction, user, profession) {
        try {
            let data = await professionSchema.findOne({ Guild: interaction.guild.id, User: user.id });
            
            if (data) {
                // Store experience in previous profession
                const oldProfession = data.Profession;
                if (oldProfession !== 'Unemployed') {
                    data.ProfessionExperience = data.ProfessionExperience || {};
                    data.ProfessionExperience[oldProfession] = data.Experience;
                }
                
                // Set new profession
                data.Profession = profession;
                
                // Restore experience if user had this profession before
                if (data.ProfessionExperience && data.ProfessionExperience[profession]) {
                    data.Experience = data.ProfessionExperience[profession];
                } else {
                    data.Experience = 0;
                }
                
                // Reset tier based on experience
                if (data.Experience >= 1000) {
                    data.Tier = 3; // Expert
                } else if (data.Experience >= 500) {
                    data.Tier = 2; // Intermediate
                } else {
                    data.Tier = 1; // Beginner
                }
                
                await data.save();
            }
            else {
                data = new professionSchema({
                    Guild: interaction.guild.id,
                    User: user.id,
                    Profession: profession,
                    Experience: 0,
                    Tier: 1,
                    ProfessionExperience: {}
                });
                await data.save();
            }
            
            return true;
        } catch (error) {
            console.error(`[Economy] Error choosing profession:`, error);
            return false;
        }
    }
    
    client.addExperience = async function (interaction, user, amount) {
        try {
            let data = await professionSchema.findOne({ Guild: interaction.guild.id, User: user.id });
            let promoted = false;
            let newTier = 0;
            
            if (data) {
                data.Experience += amount;
                data.TotalWorked = (data.TotalWorked || 0) + 1;
                data.TotalEarned = (data.TotalEarned || 0) + amount;
                
                // Check for tier promotion
                if (data.Experience >= 1000 && data.Tier < 3) {
                    data.Tier = 3; // Promote to Expert
                    promoted = true;
                    newTier = 3;
                }
                else if (data.Experience >= 500 && data.Tier < 2) {
                    data.Tier = 2; // Promote to Intermediate
                    promoted = true;
                    newTier = 2;
                }
                
                await data.save();
                
                // Send promotion message if promoted
                if (promoted) {
                    const tierName = newTier === 3 ? "Expert" : "Intermediate";
                    const bonus = newTier === 3 ? "50%" : "25%";
                    
                    client.embed({
                        title: `🎖️ Promotion!`,
                        desc: `Congratulations! You've been promoted to ${tierName} ${data.Profession}!`,
                        fields: [
                            {
                                name: `💼┆Profession`,
                                value: `${data.Profession}`,
                                inline: true
                            },
                            {
                                name: `🔰┆New Tier`,
                                value: `${tierName} (Tier ${newTier})`,
                                inline: true
                            },
                            {
                                name: `💰┆Bonus`,
                                value: `You now earn ${bonus} more from work!`,
                                inline: true
                            }
                        ],
                        color: client.config.colors.success
                    }, interaction.channel);
                }
                
                return { experience: data.Experience, tier: data.Tier, promoted };
            }
            else {
                data = new professionSchema({
                    Guild: interaction.guild.id,
                    User: user.id,
                    Profession: 'Unemployed',
                    Experience: 0,
                    Tier: 1,
                    TotalWorked: 1,
                    TotalEarned: amount,
                    ProfessionExperience: {}
                });
                await data.save();
                
                return { experience: 0, tier: 1, promoted: false };
            }
        } catch (error) {
            console.error(`[Economy] Error adding experience:`, error);
            return { experience: 0, tier: 1, promoted: false };
        }
    }
    
    // Inflation system
    async function updateEconomyStats(guildId, moneyChange, bankChange) {
        try {
            let data = await statsSchema.findOne({ Guild: guildId });
            
            if (data) {
                // Update money totals
                data.TotalMoney += moneyChange;
                data.TotalBank += bankChange;
                data.TotalTransactions += 1;
                
                // Calculate inflation rate based on total money
                const totalEconomy = data.TotalMoney + data.TotalBank;
                if (totalEconomy > data.InflationThreshold) {
                    // Calculate inflation rate: 1% for every 1k over threshold
                    const excessMoney = totalEconomy - data.InflationThreshold;
                    data.InflationRate = Math.floor(excessMoney / 1000);
                    
                    // Cap inflation at 50%
                    if (data.InflationRate > 50) data.InflationRate = 50;
                } else {
                    data.InflationRate = 0;
                }
                
                data.LastUpdated = Date.now();
                await data.save();
                
                // Update store prices based on inflation
                if (data.InflationRate > 0) {
                    await updateStorePrices(guildId, data.InflationRate);
                }
                
                console.log(`[Economy] Updated stats - Total: $${totalEconomy}, Inflation: ${data.InflationRate}%`);
            }
            else {
                // Create new stats record
                data = new statsSchema({
                    Guild: guildId,
                    TotalMoney: moneyChange > 0 ? moneyChange : 0,
                    TotalBank: bankChange > 0 ? bankChange : 0,
                    TotalTransactions: 1,
                    InflationThreshold: 100000, // Default threshold
                    InflationRate: 0,
                    LastUpdated: Date.now()
                });
                await data.save();
                
                console.log(`[Economy] Created new economy stats for guild ${guildId}`);
            }
        } catch (error) {
            console.error(`[Economy] Error updating economy stats:`, error);
        }
    }
    
    async function updateStorePrices(guildId, inflationRate) {
        try {
            const items = await storeSchema.find({ Guild: guildId });
            
            if (items && items.length > 0) {
                for (const item of items) {
                    // Skip items without BaseAmount
                    if (!item.BaseAmount) {
                        // Set BaseAmount equal to Amount for legacy items
                        item.BaseAmount = item.Amount;
                    }
                    
                    // Calculate new price with inflation
                    const inflationMultiplier = 1 + (inflationRate / 100);
                    item.Amount = Math.floor(item.BaseAmount * inflationMultiplier);
                    await item.save();
                }
                
                console.log(`[Economy] Updated prices with inflation rate: ${inflationRate}%`);
            }
        } catch (error) {
            console.error(`[Economy] Error updating store prices:`, error);
        }
    }
    
    // Get inflation rate for display
    client.getInflationRate = async function (guildId) {
        const data = await statsSchema.findOne({ Guild: guildId });
        if (data) {
            return data.InflationRate;
        }
        return 0;
    }
    
    // Calculate work earnings based on profession and tier
    client.calculateWorkEarnings = async function (interaction, user) {
        const profData = await professionSchema.findOne({ Guild: interaction.guild.id, User: user.id });
        
        // Base earnings by profession
        const baseEarnings = {
            'Unemployed': { min: 1, max: 50 },
            'Fisherman': { min: 10, max: 100 },
            'Miner': { min: 20, max: 120 },
            'Chef': { min: 15, max: 110 },
            'Programmer': { min: 25, max: 150 },
            'Doctor': { min: 30, max: 200 },
            'Builder': { min: 20, max: 130 }
        };
        
        if (!profData || profData.Profession === 'Unemployed') {
            // Random amount for unemployed
            return Math.floor(Math.random() * 50) + 1;
        }
        
        // Get base range for profession
        const profession = profData.Profession;
        const { min, max } = baseEarnings[profession] || baseEarnings['Unemployed'];
        
        // Apply tier multiplier
        let tierMultiplier = 1;
        if (profData.Tier === 2) tierMultiplier = 1.25;
        if (profData.Tier === 3) tierMultiplier = 1.5;
        
        // Calculate final amount
        const baseAmount = Math.floor(Math.random() * (max - min + 1)) + min;
        return Math.floor(baseAmount * tierMultiplier);
    }
    
    // Check if user has required tool for profession
    client.hasRequiredTool = async function (interaction, user, profession) {
        const itemData = await itemSchema.findOne({ Guild: interaction.guild.id, User: user.id });
        
        if (!itemData) return false;
        
        switch(profession) {
            case 'Fisherman':
                return itemData.FishingRod === true;
            case 'Miner':
                return itemData.PickAxe === true;
            case 'Chef':
                return itemData.Spatula === true;
            case 'Programmer':
                return itemData.Laptop === true;
            case 'Doctor':
                return itemData.MedKit === true;
            case 'Builder':
                return itemData.Hammer === true;
            default:
                return true; // No tool required for Unemployed
        }
    }
    
    // Use tool (increment usage counter)
    client.useTool = async function (interaction, user, profession) {
        const itemData = await itemSchema.findOne({ Guild: interaction.guild.id, User: user.id });
        
        if (!itemData) return false;
        
        let toolBroken = false;
        
        switch(profession) {
            case 'Fisherman':
                itemData.FishingRodUsage += 1;
                // Check if tool is broken based on tier
                const fishMaxUses = 15 + (itemData.FishingRodTier * 10);
                if (itemData.FishingRodUsage >= fishMaxUses) {
                    itemData.FishingRod = false;
                    toolBroken = true;
                }
                break;
            case 'Miner':
                itemData.PickAxeUsage += 1;
                const pickMaxUses = 15 + (itemData.PickAxeTier * 10);
                if (itemData.PickAxeUsage >= pickMaxUses) {
                    itemData.PickAxe = false;
                    toolBroken = true;
                }
                break;
            case 'Chef':
                itemData.SpatulaUsage += 1;
                const spatMaxUses = 15 + (itemData.SpatulaTier * 10);
                if (itemData.SpatulaUsage >= spatMaxUses) {
                    itemData.Spatula = false;
                    toolBroken = true;
                }
                break;
            case 'Programmer':
                itemData.LaptopUsage += 1;
                const laptopMaxUses = 15 + (itemData.LaptopTier * 10);
                if (itemData.LaptopUsage >= laptopMaxUses) {
                    itemData.Laptop = false;
                    toolBroken = true;
                }
                break;
            case 'Doctor':
                itemData.MedKitUsage += 1;
                const medMaxUses = 15 + (itemData.MedKitTier * 10);
                if (itemData.MedKitUsage >= medMaxUses) {
                    itemData.MedKit = false;
                    toolBroken = true;
                }
                break;
            case 'Builder':
                itemData.HammerUsage += 1;
                const hammerMaxUses = 15 + (itemData.HammerTier * 10);
                if (itemData.HammerUsage >= hammerMaxUses) {
                    itemData.Hammer = false;
                    toolBroken = true;
                }
                break;
        }
        
        itemData.save();
        return toolBroken;
    }
}