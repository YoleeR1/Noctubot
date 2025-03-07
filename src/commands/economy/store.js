const Discord = require('discord.js');

const store = require("../../database/models/economyStore");
const statsSchema = require("../../database/models/economyStats");
const professionSchema = require("../../database/models/economyProfessions");
const { formatCurrency } = require("../../assets/utils/currencyFormatter");

module.exports = async (client, interaction, args) => {
    // Get inflation rate
    const inflationRate = await client.getInflationRate(interaction.guild.id) || 0;
    
    // Get user's profession data
    const profData = await professionSchema.findOne({ Guild: interaction.guild.id, User: interaction.user.id });
    const userProfession = profData ? profData.Profession : 'Unemployed';
    const userTier = profData ? profData.Tier : 1;
    
    // Fetch store data
    const storeData = await store.find({ Guild: interaction.guild.id });
    
    // Define default tools if none exist in the database
    const defaultTools = [
        { ItemName: "Fishing Rod", ItemType: "tool", ItemDescription: "Required for Fisherman profession", Amount: 100, ToolTier: 1 },
        { ItemName: "Pickaxe", ItemType: "tool", ItemDescription: "Required for Miner profession", Amount: 150, ToolTier: 1 },
        { ItemName: "Spatula", ItemType: "tool", ItemDescription: "Required for Chef profession", Amount: 120, ToolTier: 1 },
        { ItemName: "Laptop", ItemType: "tool", ItemDescription: "Required for Programmer profession", Amount: 200, ToolTier: 1 },
        { ItemName: "Med Kit", ItemType: "tool", ItemDescription: "Required for Doctor profession", Amount: 250, ToolTier: 1 },
        { ItemName: "Hammer", ItemType: "tool", ItemDescription: "Required for Builder profession", Amount: 130, ToolTier: 1 }
    ];
    
    // Define default collectibles
    const defaultCollectibles = [
        { ItemName: "Diamond Crown", ItemType: "collectible", ItemDescription: "A symbol of ultimate wealth and prestige", Amount: 1000000 },
        { ItemName: "Golden Statue", ItemType: "collectible", ItemDescription: "A solid gold statue of yourself", Amount: 500000 },
        { ItemName: "Rare Painting", ItemType: "collectible", ItemDescription: "A masterpiece from a renowned artist", Amount: 250000 },
        { ItemName: "Exotic Pet", ItemType: "collectible", ItemDescription: "A rare and exotic companion", Amount: 100000 },
        { ItemName: "Luxury Yacht", ItemType: "collectible", ItemDescription: "Sail the virtual seas in style", Amount: 750000 },
        { ItemName: "Vintage Wine", ItemType: "collectible", ItemDescription: "Aged to perfection", Amount: 50000 },
        { ItemName: "Ancient Artifact", ItemType: "collectible", ItemDescription: "A mysterious relic from the past", Amount: 300000 }
    ];
    
    // Check if we need to add default tools to the database
    if (!storeData.some(item => item.ItemType === "tool")) {
        for (const tool of defaultTools) {
            const newTool = new store({
                Guild: interaction.guild.id,
                ItemName: tool.ItemName,
                ItemType: tool.ItemType,
                ItemDescription: tool.ItemDescription,
                Amount: tool.Amount,
                BaseAmount: tool.Amount,
                ToolTier: tool.ToolTier
            });
            await newTool.save();
        }
        
        // Refresh store data after adding default tools
        storeData.push(...defaultTools.map(tool => ({
            ...tool,
            BaseAmount: tool.Amount,
            Guild: interaction.guild.id
        })));
    }
    
    // Check if we need to add default collectibles to the database
    if (!storeData.some(item => item.ItemType === "collectible")) {
        for (const collectible of defaultCollectibles) {
            const newCollectible = new store({
                Guild: interaction.guild.id,
                ItemName: collectible.ItemName,
                ItemType: collectible.ItemType,
                ItemDescription: collectible.ItemDescription,
                Amount: collectible.Amount,
                BaseAmount: collectible.Amount
            });
            await newCollectible.save();
        }
        
        // Refresh store data after adding default collectibles
        storeData.push(...defaultCollectibles.map(collectible => ({
            ...collectible,
            BaseAmount: collectible.Amount,
            Guild: interaction.guild.id
        })));
    }
    
    // Group items by type
    const roles = storeData.filter(item => item.ItemType === 'role' || (item.Role && !item.ItemType));
    const tools = storeData.filter(item => item.ItemType === 'tool');
    const consumables = storeData.filter(item => item.ItemType === 'consumable');
    const collectibles = storeData.filter(item => item.ItemType === 'collectible');
    const special = storeData.filter(item => item.ItemType === 'special');
    
    // Create embeds for each category
    const embeds = [];
    
    // Main store embed with inflation info
    const mainEmbed = new Discord.EmbedBuilder()
        .setTitle(`🛒・${interaction.guild.name}'s Store`)
        .setDescription(`Welcome to the store! Browse our categories below.${inflationRate > 0 ? `\n\n**Current Inflation Rate: ${inflationRate}%**\nPrices are currently inflated due to the economy.` : ''}`)
        .setColor(client.config.colors.normal)
        .addFields(
            { name: '👑┆Roles', value: roles.length > 0 ? `${roles.length} items available` : 'No roles available', inline: true },
            { name: '🛠️┆Tools', value: tools.length > 0 ? `${tools.length} items available` : 'No tools available', inline: true },
            { name: '🧪┆Consumables', value: consumables.length > 0 ? `${consumables.length} items available` : 'No consumables available', inline: true },
            { name: '🏆┆Collectibles', value: collectibles.length > 0 ? `${collectibles.length} items available` : 'No collectibles available', inline: true },
            { name: '✨┆Special', value: special.length > 0 ? `${special.length} items available` : 'No special items available', inline: true },
            { name: '💼┆Your Profession', value: `${userProfession} (Tier ${userTier})`, inline: true }
        )
        .setFooter({ text: 'Use the buttons below to browse categories' });
    
    embeds.push(mainEmbed);
    
    // Roles embed
    if (roles.length > 0) {
        const rolesEmbed = new Discord.EmbedBuilder()
            .setTitle('👑・Roles')
            .setDescription('Purchase roles with your hard-earned money!')
            .setColor(client.config.colors.normal);
        
        for (const item of roles) {
            const role = interaction.guild.roles.cache.get(item.Role);
            if (role) {
                rolesEmbed.addFields({
                    name: `${role.name}`,
                    value: `${client.emotes.economy.coins} $${formatCurrency(item.Amount)}${inflationRate > 0 ? ` (Base: $${formatCurrency(item.BaseAmount || item.Amount)})` : ''}\n**To buy:** \`/economy buy item:${role.id}\``,
                    inline: true
                });
            }
        }
        
        embeds.push(rolesEmbed);
    }
    
    // Tools embed
    if (tools.length > 0) {
        const toolsEmbed = new Discord.EmbedBuilder()
            .setTitle('🛠️・Tools')
            .setDescription('Tools required for various professions!')
            .setColor(client.config.colors.normal);
        
        for (const item of tools) {
            // Check if tool is for user's profession
            const isForUserProfession = 
                (item.ItemName === "Fishing Rod" && userProfession === "Fisherman") ||
                (item.ItemName === "Pickaxe" && userProfession === "Miner") ||
                (item.ItemName === "Spatula" && userProfession === "Chef") ||
                (item.ItemName === "Laptop" && userProfession === "Programmer") ||
                (item.ItemName === "Med Kit" && userProfession === "Doctor") ||
                (item.ItemName === "Hammer" && userProfession === "Builder");
            
            toolsEmbed.addFields({
                name: `${isForUserProfession ? '✅ ' : ''}${item.ItemName} (Tier ${item.ToolTier})`,
                value: `${client.emotes.economy.coins} $${formatCurrency(item.Amount)}${inflationRate > 0 ? ` (Base: $${formatCurrency(item.BaseAmount || item.Amount)})` : ''}\n${item.ItemDescription}\n**To buy:** \`/economy buy item:${item.ItemName}\``,
                inline: true
            });
        }
        
        embeds.push(toolsEmbed);
    }
    
    // Consumables embed
    if (consumables.length > 0) {
        const consumablesEmbed = new Discord.EmbedBuilder()
            .setTitle('🧪・Consumables')
            .setDescription('One-time use items with special effects!')
            .setColor(client.config.colors.normal);
        
        for (const item of consumables) {
            consumablesEmbed.addFields({
                name: `${item.ItemName}`,
                value: `${client.emotes.economy.coins} $${formatCurrency(item.Amount)}${inflationRate > 0 ? ` (Base: $${formatCurrency(item.BaseAmount || item.Amount)})` : ''}\n${item.ItemDescription}\n**To buy:** \`/economy buy item:${item.ItemName}\``,
                inline: true
            });
        }
        
        embeds.push(consumablesEmbed);
    }
    
    // Collectibles embed
    if (collectibles.length > 0) {
        const collectiblesEmbed = new Discord.EmbedBuilder()
            .setTitle('🏆・Collectibles')
            .setDescription('Rare items to show off your wealth!')
            .setColor(client.config.colors.normal);
        
        for (const item of collectibles) {
            collectiblesEmbed.addFields({
                name: `${item.ItemName}`,
                value: `${client.emotes.economy.coins} $${formatCurrency(item.Amount)}${inflationRate > 0 ? ` (Base: $${formatCurrency(item.BaseAmount || item.Amount)})` : ''}\n${item.ItemDescription}\n**To buy:** \`/economy buy item:${item.ItemName}\``,
                inline: true
            });
        }
        
        embeds.push(collectiblesEmbed);
    }
    
    // Special embed
    if (special.length > 0) {
        const specialEmbed = new Discord.EmbedBuilder()
            .setTitle('✨・Special Items')
            .setDescription('Unique items with powerful effects!')
            .setColor(client.config.colors.normal);
        
        for (const item of special) {
            specialEmbed.addFields({
                name: `${item.ItemName}`,
                value: `${client.emotes.economy.coins} $${formatCurrency(item.Amount)}${inflationRate > 0 ? ` (Base: $${formatCurrency(item.BaseAmount || item.Amount)})` : ''}\n${item.ItemDescription}\n**To buy:** \`/economy buy item:${item.ItemName}\``,
                inline: true
            });
        }
        
        embeds.push(specialEmbed);
    }
    
    // Create pagination buttons
    const buttons = [];
    
    if (embeds.length > 1) {
        const row = new Discord.ActionRowBuilder();
        
        // Main store button
        row.addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('store_main')
                .setLabel('Main')
                .setStyle(Discord.ButtonStyle.Primary)
                .setEmoji('🛒')
        );
        
        // Category buttons
        if (roles.length > 0) {
            row.addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('store_roles')
                    .setLabel('Roles')
                    .setStyle(Discord.ButtonStyle.Secondary)
                    .setEmoji('👑')
            );
        }
        
        if (tools.length > 0) {
            row.addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('store_tools')
                    .setLabel('Tools')
                    .setStyle(Discord.ButtonStyle.Secondary)
                    .setEmoji('🛠️')
            );
        }
        
        if (consumables.length > 0) {
            row.addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('store_consumables')
                    .setLabel('Consumables')
                    .setStyle(Discord.ButtonStyle.Secondary)
                    .setEmoji('🧪')
            );
        }
        
        // Add more buttons for other categories if they exist
        buttons.push(row);
        
        // Second row if needed
        if (collectibles.length > 0 || special.length > 0) {
            const row2 = new Discord.ActionRowBuilder();
            
            if (collectibles.length > 0) {
                row2.addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('store_collectibles')
                        .setLabel('Collectibles')
                        .setStyle(Discord.ButtonStyle.Secondary)
                        .setEmoji('🏆')
                );
            }
            
            if (special.length > 0) {
                row2.addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('store_special')
                        .setLabel('Special')
                        .setStyle(Discord.ButtonStyle.Secondary)
                        .setEmoji('✨')
                );
            }
            
            if (row2.components.length > 0) {
                buttons.push(row2);
            }
        }
    }
    
    // Send initial embed
    const message = await interaction.editReply({
        embeds: [embeds[0]],
        components: buttons
    });
    
    // Handle button interactions
    if (buttons.length > 0) {
        const collector = message.createMessageComponentCollector({ 
            filter: i => i.user.id === interaction.user.id,
            time: 120000 
        });
        
        collector.on('collect', async i => {
            const id = i.customId;
            
            switch (id) {
                case 'store_main':
                    await i.update({ embeds: [embeds[0]], components: buttons });
                    break;
                case 'store_roles':
                    await i.update({ embeds: [embeds.find(e => e.data.title.includes('Roles'))], components: buttons });
                    break;
                case 'store_tools':
                    await i.update({ embeds: [embeds.find(e => e.data.title.includes('Tools'))], components: buttons });
                    break;
                case 'store_consumables':
                    await i.update({ embeds: [embeds.find(e => e.data.title.includes('Consumables'))], components: buttons });
                    break;
                case 'store_collectibles':
                    await i.update({ embeds: [embeds.find(e => e.data.title.includes('Collectibles'))], components: buttons });
                    break;
                case 'store_special':
                    await i.update({ embeds: [embeds.find(e => e.data.title.includes('Special'))], components: buttons });
                    break;
            }
        });
        
        collector.on('end', () => {
            interaction.editReply({ components: [] }).catch(() => {});
        });
    }
}