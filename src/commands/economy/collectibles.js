const Discord = require('discord.js');

const Schema = require("../../database/models/economy");
const itemSchema = require("../../database/models/economyItems");
const store = require("../../database/models/economyStore");
const economyStats = require("../../database/models/economyStats");

module.exports = async (client, interaction, args) => {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'view': {
            // View collectibles in inventory
            await viewCollectibles(client, interaction);
            break;
        }
        case 'shop': {
            // View collectibles shop
            await collectiblesShop(client, interaction);
            break;
        }
        case 'buy': {
            // Buy a collectible
            const collectibleName = interaction.options.getString('name');
            await buyCollectible(client, interaction, collectibleName);
            break;
        }
    }
}

// Function to view collectibles in inventory
async function viewCollectibles(client, interaction) {
    const user = interaction.user;

    try {
        // Get user's inventory
        const inventory = await itemSchema.findOne({ Guild: interaction.guild.id, User: user.id });
        
        if (!inventory || !inventory.Inventory || Object.keys(inventory.Inventory).length === 0) {
            return client.embed({
                title: `${client.emotes.normal.error}・Error`,
                desc: `You don't have any collectibles yet! Check out \`/economy collectibles shop\` to see what's available.`,
                color: client.config?.color || 0x2F3136,
                type: 'editreply'
            }, interaction);
        }

        // Filter for collectible items only
        const collectibles = {};
        for (const [key, value] of Object.entries(inventory.Inventory)) {
            if (key.startsWith('collectible_')) {
                collectibles[key.replace('collectible_', '')] = value;
            }
        }

        if (Object.keys(collectibles).length === 0) {
            return client.embed({
                title: `${client.emotes.normal.error}・Error`,
                desc: `You don't have any collectibles yet! Check out \`/economy collectibles shop\` to see what's available.`,
                color: client.config?.color || 0x2F3136,
                type: 'editreply'
            }, interaction);
        }

        // Create embed to display collectibles
        const embed = new Discord.EmbedBuilder()
            .setTitle(`🏆 ${user.username}'s Collectibles`)
            .setColor(client.config?.color || 0x2F3136)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setDescription("These rare items showcase your wealth and status!");

        // Add each collectible to the embed
        for (const [name, quantity] of Object.entries(collectibles)) {
            // Get item details from store
            const storeItem = await store.findOne({ 
                Guild: interaction.guild.id, 
                ItemName: `collectible_${name}`,
                ItemType: 'collectible'
            });

            let description = "A rare collectible item";
            if (storeItem && storeItem.ItemDescription) {
                description = storeItem.ItemDescription;
            }

            embed.addFields({
                name: formatCollectibleName(name),
                value: `${quantity}x - ${description}`,
                inline: false
            });
        }

        return client.embed({
            title: embed.data.title,
            desc: embed.data.description,
            thumbnail: user.displayAvatarURL({ dynamic: true }),
            fields: embed.data.fields,
            color: client.config?.color || 0x2F3136,
            footer: "Use /economy sell to sell collectibles from your inventory",
            type: 'editreply'
        }, interaction);
    } catch (error) {
        console.error("Error in viewCollectibles:", error);
        return client.embed({
            title: `${client.emotes.normal.error}・Error`,
            desc: `An error occurred while retrieving your collectibles.`,
            color: client.config?.color || 0x2F3136,
            type: 'editreply'
        }, interaction);
    }
}

// Function to display collectibles shop
async function collectiblesShop(client, interaction) {
    try {
        // Get economy stats for inflation
        const stats = await economyStats.findOne({ Guild: interaction.guild.id });
        const inflationRate = stats?.InflationRate || 0;

        // Get collectibles from store
        let storeItems = await store.find({ 
            Guild: interaction.guild.id,
            ItemType: 'collectible'
        });

        // Add default collectibles if none exist
        if (!storeItems || storeItems.length === 0) {
            await addDefaultCollectibles(interaction.guild.id);
            storeItems = await store.find({ 
                Guild: interaction.guild.id,
                ItemType: 'collectible'
            });
        }

        // Create embed for collectibles shop
        const embed = new Discord.EmbedBuilder()
            .setTitle(`🏆 Rare Collectibles Shop`)
            .setColor(client.config?.color || 0x2F3136)
            .setDescription(`Exclusive items to showcase your wealth and status!\n${inflationRate > 0 ? `*Current inflation: ${inflationRate}%*` : ''}`)
            .setFooter({ text: "Use /economy collectibles buy name:[item name] to purchase" });

        // Add each collectible to the embed
        for (const item of storeItems) {
            embed.addFields({
                name: formatCollectibleName(item.ItemName.replace('collectible_', '')),
                value: `${client.emotes.economy.coins} $${item.Amount}${inflationRate > 0 ? ` (Base: $${item.BaseAmount || item.Amount})` : ''}\n${item.ItemDescription}\n**To buy:** \`/economy collectibles buy name:${item.ItemName.replace('collectible_', '')}\``,
                inline: true
            });
        }

        return client.embed({
            title: embed.data.title,
            desc: embed.data.description,
            fields: embed.data.fields,
            color: client.config?.color || 0x2F3136,
            footer: "Use /economy collectibles buy name:[item name] to purchase",
            type: 'editreply'
        }, interaction);
    } catch (error) {
        console.error("Error in collectiblesShop:", error);
        return client.embed({
            title: `${client.emotes.normal.error}・Error`,
            desc: `An error occurred while retrieving the collectibles shop.`,
            color: client.config?.color || 0x2F3136,
            type: 'editreply'
        }, interaction);
    }
}

// Function to buy a collectible
async function buyCollectible(client, interaction, collectibleName) {
    const user = interaction.user;

    try {
        // Get user's economy data
        const economy = await Schema.findOne({ Guild: interaction.guild.id, User: user.id });
        if (!economy) {
            return client.embed({
                title: `${client.emotes.normal.error}・Error`,
                desc: `You don't have any ${client.emotes.economy.coins}!`,
                color: client.config?.color || 0x2F3136,
                type: 'editreply'
            }, interaction);
        }

        // Find the collectible in the store
        const storeItem = await store.findOne({ 
            Guild: interaction.guild.id, 
            ItemName: `collectible_${collectibleName}`,
            ItemType: 'collectible'
        });

        if (!storeItem) {
            return client.embed({
                title: `${client.emotes.normal.error}・Error`,
                desc: `Collectible "${formatCollectibleName(collectibleName)}" not found in the shop!`,
                color: client.config?.color || 0x2F3136,
                type: 'editreply'
            }, interaction);
        }

        // Check if user has enough money
        if (economy.Money < storeItem.Amount) {
            return client.embed({
                title: `${client.emotes.normal.error}・Error`,
                desc: `You don't have enough money to buy this collectible! You need ${client.emotes.economy.coins} $${storeItem.Amount - economy.Money} more.`,
                color: client.config?.color || 0x2F3136,
                type: 'editreply'
            }, interaction);
        }

        // Add collectible to inventory
        let inventory = await itemSchema.findOne({ Guild: interaction.guild.id, User: user.id });
        if (!inventory) {
            inventory = new itemSchema({
                Guild: interaction.guild.id,
                User: user.id,
                Inventory: {}
            });
        }

        // Initialize Inventory if it doesn't exist
        if (!inventory.Inventory) {
            inventory.Inventory = {};
        }

        const itemKey = `collectible_${collectibleName}`;
        if (inventory.Inventory[itemKey]) {
            inventory.Inventory[itemKey] += 1;
        } else {
            inventory.Inventory[itemKey] = 1;
        }

        // Deduct money and save
        economy.Money -= storeItem.Amount;
        await economy.save();
        await inventory.save();

        return client.embed({
            title: `${client.emotes.normal.check}・Success`,
            desc: `You purchased the "${formatCollectibleName(collectibleName)}" collectible for ${client.emotes.economy.coins} $${storeItem.Amount}!`,
            color: client.config?.color || 0x2F3136,
            type: 'editreply'
        }, interaction);
    } catch (error) {
        console.error("Error in buyCollectible:", error);
        return client.embed({
            title: `${client.emotes.normal.error}・Error`,
            desc: `An error occurred while purchasing the collectible.`,
            color: client.config?.color || 0x2F3136,
            type: 'editreply'
        }, interaction);
    }
}

// Helper function to format collectible names
function formatCollectibleName(name) {
    return name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Function to add default collectibles to the store
async function addDefaultCollectibles(guildId) {
    const defaultCollectibles = [
        {
            name: "diamond_crown",
            description: "A dazzling crown made of pure diamonds. The ultimate symbol of wealth and power.",
            price: 1000000
        },
        {
            name: "golden_statue",
            description: "A solid gold statue of yourself. Show everyone who's boss!",
            price: 500000
        },
        {
            name: "rare_painting",
            description: "A masterpiece from a renowned artist. A true collector's item.",
            price: 250000
        },
        {
            name: "exotic_pet",
            description: "A rare and exotic pet that few can afford to maintain.",
            price: 100000
        },
        {
            name: "luxury_yacht",
            description: "A miniature model of your luxury yacht. You definitely own the real thing too...",
            price: 750000
        },
        {
            name: "vintage_wine",
            description: "An extremely rare bottle of wine from centuries ago.",
            price: 50000
        },
        {
            name: "ancient_artifact",
            description: "A mysterious artifact with unknown powers. Mainly for showing off.",
            price: 300000
        }
    ];

    for (const collectible of defaultCollectibles) {
        const existing = await store.findOne({ 
            Guild: guildId, 
            ItemName: `collectible_${collectible.name}`,
            ItemType: 'collectible'
        });

        if (!existing) {
            const newCollectible = new store({
                Guild: guildId,
                ItemName: `collectible_${collectible.name}`,
                ItemType: 'collectible',
                ItemDescription: collectible.description,
                Amount: collectible.price,
                BaseAmount: collectible.price
            });
            await newCollectible.save();
        }
    }
}