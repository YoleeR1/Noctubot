const Discord = require('discord.js');

const Schema = require("../../database/models/economy");
const store = require("../../database/models/economyStore");
const items = require("../../database/models/economyItems");
const professionSchema = require("../../database/models/economyProfessions");
const statsSchema = require("../../database/models/economyStats");

module.exports = async (client, interaction, args) => {
    // Get user's money data
    const data = await Schema.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
    if (!data) {
        return client.errNormal({
            error: `You don't have any money yet! Try working first.`,
            type: 'editreply'
        }, interaction);
    }
    
    // Get user's profession data
    const profData = await professionSchema.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
    const userProfession = profData ? profData.Profession : 'Unemployed';
    const userTier = profData ? profData.Tier : 1;
    
    // Get the item to buy
    const itemToBuy = interaction.options.getString('item');
    
    // Check if it's a role purchase
    if (interaction.guild.roles.cache.get(itemToBuy)) {
        // It's a role purchase
        const role = interaction.guild.roles.cache.get(itemToBuy);
        const buyPerson = interaction.guild.members.cache.get(interaction.user.id);
        
        // Check if role exists in store
        const checkStore = await store.findOne({ Guild: interaction.guild.id, Role: role.id });
        if (!checkStore) {
            return client.errNormal({
                error: `This role is not available in the store!`,
                type: 'editreply'
            }, interaction);
        }
        
        // Check if user has enough money
        if (parseInt(checkStore.Amount) > parseInt(data.Money)) {
            return client.errNormal({
                error: `You don't have enough money to buy this! You need ${client.emotes.economy.coins} $${checkStore.Amount - data.Money} more.`,
                type: 'editreply'
            }, interaction);
        }
        
        // Check for profession/tier requirements
        if (checkStore.RequiredProfession && checkStore.RequiredProfession !== userProfession) {
            return client.errNormal({
                error: `This role requires the ${checkStore.RequiredProfession} profession!`,
                type: 'editreply'
            }, interaction);
        }
        
        if (checkStore.RequiredTier && checkStore.RequiredTier > userTier) {
            return client.errNormal({
                error: `This role requires ${getTierName(checkStore.RequiredTier)} tier or higher!`,
                type: 'editreply'
            }, interaction);
        }
        
        // Remove money and add role
        client.removeMoney(interaction, interaction.user, parseInt(checkStore.Amount));
        
        try {
            await buyPerson.roles.add(role);
        } catch (e) {
            return client.errNormal({
                error: `I can't add <@&${role.id}> to you! Check my permissions.`,
                type: 'editreply'
            }, interaction);
        }
        
        // Update economy stats
        updateEconomyStats(interaction.guild.id, 1);
        
        // Success message
        client.succNormal({
            text: `The purchase has been successfully completed`,
            fields: [
                {
                    name: `📘┆Item`,
                    value: `<@&${role.id}>`
                },
                {
                    name: `${client.emotes.economy.coins}┆Cost`,
                    value: `$${checkStore.Amount}`
                }
            ],
            type: 'editreply'
        }, interaction);
    } else {
        // It's an item purchase, not a role
        const storeItem = await store.findOne({ 
            Guild: interaction.guild.id, 
            ItemName: itemToBuy 
        });
        
        if (!storeItem) {
            // Check if it's one of the default tools or collectibles
            const defaultTools = ["Fishing Rod", "Pickaxe", "Spatula", "Laptop", "Med Kit", "Hammer"];
            const defaultCollectibles = ["Diamond Crown", "Golden Statue", "Rare Painting", 
                                        "Exotic Pet", "Luxury Yacht", "Vintage Wine", "Ancient Artifact"];
            
            if (defaultTools.includes(itemToBuy)) {
                // Create the default tool in the database
                const toolData = {
                    "Fishing Rod": { price: 100, description: "Required for Fisherman profession", tier: 1 },
                    "Pickaxe": { price: 150, description: "Required for Miner profession", tier: 1 },
                    "Spatula": { price: 120, description: "Required for Chef profession", tier: 1 },
                    "Laptop": { price: 200, description: "Required for Programmer profession", tier: 1 },
                    "Med Kit": { price: 250, description: "Required for Doctor profession", tier: 1 },
                    "Hammer": { price: 130, description: "Required for Builder profession", tier: 1 }
                };
                
                const newTool = new store({
                    Guild: interaction.guild.id,
                    ItemName: itemToBuy,
                    ItemType: "tool",
                    ItemDescription: toolData[itemToBuy].description,
                    Amount: toolData[itemToBuy].price,
                    BaseAmount: toolData[itemToBuy].price,
                    ToolTier: toolData[itemToBuy].tier
                });
                
                await newTool.save();
                
                // Now process the purchase with the newly created item
                return processPurchase(client, interaction, itemToBuy, toolData[itemToBuy].price, data, "tool");
            }
            
            if (defaultCollectibles.includes(itemToBuy)) {
                // Create the default collectible in the database
                const collectibleData = {
                    "Diamond Crown": { price: 1000000, description: "A symbol of ultimate wealth and prestige" },
                    "Golden Statue": { price: 500000, description: "A solid gold statue of yourself" },
                    "Rare Painting": { price: 250000, description: "A masterpiece from a renowned artist" },
                    "Exotic Pet": { price: 100000, description: "A rare and exotic companion" },
                    "Luxury Yacht": { price: 750000, description: "Sail the virtual seas in style" },
                    "Vintage Wine": { price: 50000, description: "Aged to perfection" },
                    "Ancient Artifact": { price: 300000, description: "A mysterious relic from the past" }
                };
                
                const newCollectible = new store({
                    Guild: interaction.guild.id,
                    ItemName: itemToBuy,
                    ItemType: "collectible",
                    ItemDescription: collectibleData[itemToBuy].description,
                    Amount: collectibleData[itemToBuy].price,
                    BaseAmount: collectibleData[itemToBuy].price
                });
                
                await newCollectible.save();
                
                // Now process the purchase with the newly created item
                return processPurchase(client, interaction, itemToBuy, collectibleData[itemToBuy].price, data, "collectible");
            }
            
            return client.errNormal({
                error: `This item is not available in the store!`,
                type: 'editreply'
            }, interaction);
        }
        
        // Check if user has enough money
        if (parseInt(storeItem.Amount) > parseInt(data.Money)) {
            return client.errNormal({
                error: `You don't have enough money to buy this! You need ${client.emotes.economy.coins} $${storeItem.Amount - data.Money} more.`,
                type: 'editreply'
            }, interaction);
        }
        
        // Check for profession/tier requirements
        if (storeItem.RequiredProfession && storeItem.RequiredProfession !== userProfession) {
            return client.errNormal({
                error: `This item requires the ${storeItem.RequiredProfession} profession!`,
                type: 'editreply'
            }, interaction);
        }
        
        if (storeItem.RequiredTier && storeItem.RequiredTier > userTier) {
            return client.errNormal({
                error: `This item requires ${getTierName(storeItem.RequiredTier)} tier or higher!`,
                type: 'editreply'
            }, interaction);
        }
        
        // Process the purchase
        processPurchase(client, interaction, itemToBuy, storeItem.Amount, data);
    }
}

// Helper function to process item purchases
async function processPurchase(client, interaction, itemName, price, data, itemType = "") {
    // Remove money
    client.removeMoney(interaction, interaction.user, parseInt(price));
    
    // Add item to inventory
    await client.buyItem(interaction, interaction.user, getItemField(itemName));
    
    // Update economy stats
    updateEconomyStats(interaction.guild.id, 1);
    
    // Success message
    client.succNormal({
        text: `The purchase has been successfully completed`,
        fields: [
            {
                name: `📘┆Item`,
                value: itemName
            },
            {
                name: `${client.emotes.economy.coins}┆Cost`,
                value: `$${price}`
            }
        ],
        type: 'editreply'
    }, interaction);
    
    // Special message for tools
    if (itemType === "tool" || ["Fishing Rod", "Pickaxe", "Spatula", "Laptop", "Med Kit", "Hammer"].includes(itemName)) {
        const professionMap = {
            "Fishing Rod": "Fisherman",
            "Pickaxe": "Miner",
            "Spatula": "Chef",
            "Laptop": "Programmer",
            "Med Kit": "Doctor",
            "Hammer": "Builder"
        };
        
        const profession = professionMap[itemName];
        
        client.embed({
            title: `🛠️・Tool Acquired!`,
            desc: `You've purchased a ${itemName}!`,
            fields: [
                {
                    name: `💼┆Profession`,
                    value: `You can now work as a ${profession}!`,
                    inline: true
                },
                {
                    name: `📋┆Next Steps`,
                    value: `Use \`/profession choose\` to select the ${profession} profession.`,
                    inline: true
                }
            ],
            color: client.config.colors.success,
            type: 'reply'
        }, interaction);
    }
    
    // Special message for collectibles
    if (itemType === "collectible") {
        client.embed({
            title: `🏆・Collectible Acquired!`,
            desc: `You've purchased a ${itemName}!`,
            fields: [
                {
                    name: `💰┆Status Symbol`,
                    value: `This rare item shows off your wealth and status!`,
                    inline: true
                },
                {
                    name: `📋┆Collection`,
                    value: `View your collection with \`/economy inventory\``,
                    inline: true
                }
            ],
            color: client.config.colors.success,
            type: 'reply'
        }, interaction);
    }
}

// Helper function to map item names to database fields
function getItemField(itemName) {
    const itemMap = {
        "Fishing Rod": "FishingRod",
        "Pickaxe": "PickAxe",
        "Spatula": "Spatula",
        "Laptop": "Laptop",
        "Med Kit": "MedKit",
        "Hammer": "Hammer"
    };
    
    // For collectibles, add a prefix to store in inventory
    const collectibles = ["Diamond Crown", "Golden Statue", "Rare Painting", 
                         "Exotic Pet", "Luxury Yacht", "Vintage Wine", "Ancient Artifact"];
    
    if (collectibles.includes(itemName)) {
        return "collectible_" + itemName.replace(/\s+/g, '_');
    }
    
    return itemMap[itemName] || itemName;
}

// Helper function to get tier name
function getTierName(tier) {
    switch(tier) {
        case 1: return "Beginner";
        case 2: return "Intermediate";
        case 3: return "Expert";
        default: return "Unknown";
    }
}

// Update economy stats
async function updateEconomyStats(guildId, itemsPurchased) {
    try {
        const data = await statsSchema.findOne({ Guild: guildId });
        if (data) {
            data.TotalItemsPurchased += itemsPurchased;
            data.TotalTransactions += 1;
            await data.save();
        }
    } catch (error) {
        console.error("Error updating economy stats:", error);
    }
}