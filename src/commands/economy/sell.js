const Discord = require('discord.js');

const Schema = require("../../database/models/economy");
const itemSchema = require("../../database/models/economyItems");

module.exports = async (client, interaction, args) => {
    const itemToSell = interaction.options.getString('item');
    const amount = interaction.options.getInteger('amount') || 1;
    
    if (amount < 1) {
        return client.errNormal({ 
            error: "You must sell at least 1 item!", 
            type: 'editreply' 
        }, interaction);
    }

    // Fetch user's items
    const userItems = await itemSchema.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
    if (!userItems) {
        return client.errNormal({ 
            error: "You don't have any items to sell!", 
            type: 'editreply' 
        }, interaction);
    }

    // Make sure inventory exists
    if (!userItems.Inventory) userItems.Inventory = new Map();

    // Normalize the input and try to find the matching item in the inventory
    let foundItem = null;
    let currentAmount = 0;
    
    // First try direct match (exact key)
    if (userItems.Inventory.has(itemToSell)) {
        foundItem = itemToSell;
        currentAmount = userItems.Inventory.get(itemToSell);
    } else {
        // If not found, try to match based on the displayed name
        const normalizedInput = itemToSell.toLowerCase().trim();
        
        // Convert Map to array for easier processing
        const inventoryArray = Array.from(userItems.Inventory.entries());
        
        for (const [key, amount] of inventoryArray) {
            // Generate possible display names for this key
            let displayName = '';
            
            if (key.startsWith('fish_')) {
                // For fish items: "Yellow Fish" from "fish_Yellow_Fish"
                displayName = key.replace('fish_', '').replace(/_/g, ' ');
            } else if (key.startsWith('collectible_')) {
                // For collectibles: "Diamond Crown" from "collectible_Diamond_Crown"
                displayName = key.replace('collectible_', '').replace(/_/g, ' ');
            } else {
                // For other items: direct replacement of underscores
                displayName = key.replace(/_/g, ' ');
            }
            
            // Compare normalized versions (case insensitive)
            if (displayName.toLowerCase() === normalizedInput) {
                foundItem = key;
                currentAmount = amount;
                break;
            }
        }
    }
    
    // If item still not found after all attempts
    if (!foundItem) {
        return client.errNormal({ 
            error: `You don't have any ${itemToSell.replace(/_/g, ' ')} to sell!`, 
            type: 'editreply' 
        }, interaction);
    }
    
    // Check if user has enough of the item
    if (currentAmount < amount) {
        return client.errNormal({ 
            error: `You only have ${currentAmount}x ${foundItem.replace(/^(fish_|collectible_)/g, '').replace(/_/g, ' ')}!`, 
            type: 'editreply' 
        }, interaction);
    }

    // Calculate sell price
    let sellPrice = 0;
    
    // Different price calculations based on item type
    if (foundItem.startsWith('fish_')) {
        // Fish prices
        const fishPrices = {
            'fish_Yellow_Fish': 10,
            'fish_Fat_Fish': 15,
            'fish_Blue_Fish': 10,
            'fish_Coconut': 20,
            'fish_Dolphin': 35,
            'fish_Lobster': 30,
            'fish_Shark': 50,
            'fish_Crab': 20,
            'fish_Squid': 25,
            'fish_Whale': 75,
            'fish_Shrimp': 15,
            'fish_Octopus': 30,
            'fish_Diamond': 100
        };
        
        sellPrice = fishPrices[foundItem] || 5; // Default to 5 if fish not found
    } else if (foundItem.startsWith('collectible_')) {
        // Collectibles sell for 80% of their purchase price
        const collectiblePrices = {
            'collectible_Diamond_Crown': 1000000,
            'collectible_Golden_Statue': 500000,
            'collectible_Rare_Painting': 250000,
            'collectible_Exotic_Pet': 100000,
            'collectible_Luxury_Yacht': 750000,
            'collectible_Vintage_Wine': 50000,
            'collectible_Ancient_Artifact': 300000
        };
        
        const basePrice = collectiblePrices[foundItem] || 1000;
        sellPrice = Math.floor(basePrice * 0.8); // 80% of purchase price
    } else {
        // Other items default price
        sellPrice = 10;
    }

    // Calculate total sell value
    const totalValue = sellPrice * amount;

    // Update inventory
    const newAmount = currentAmount - amount;
    if (newAmount <= 0) {
        userItems.Inventory.delete(foundItem);
    } else {
        userItems.Inventory.set(foundItem, newAmount);
    }
    await userItems.save();

    // Add money to user's balance
    const userData = await Schema.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
    if (userData) {
        userData.Money += totalValue;
        await userData.save();
    } else {
        await new Schema({
            Guild: interaction.guild.id,
            User: interaction.user.id,
            Money: totalValue,
            Bank: 0
        }).save();
    }

    // Format item name for display
    const itemName = foundItem.replace(/^(fish_|collectible_)/g, '').replace(/_/g, ' ');

    // Send success message
    return client.embed({
        title: '💰 Item Sold',
        desc: `You sold ${amount}x ${itemName} for $${totalValue}!`,
        fields: [
            {
                name: '💵 Sale Details',
                value: `Price per item: $${sellPrice}\nQuantity sold: ${amount}\nTotal earned: $${totalValue}`,
                inline: false
            },
            {
                name: '👝 Remaining',
                value: newAmount > 0 ? `You have ${newAmount}x ${itemName} left.` : `You have no ${itemName} left.`,
                inline: false
            }
        ],
        color: client.config?.color || 0x2F3136,
        type: 'editreply'
    }, interaction);
}