const Discord = require('discord.js');

const Schema = require("../../database/models/economy");
const itemSchema = require("../../database/models/economyItems");

module.exports = async (client, interaction, args) => {
    const user = interaction.options.getUser('user') || interaction.user;

    // Fetch user's items
    const userItems = await itemSchema.findOne({ Guild: interaction.guild.id, User: user.id });
    if (!userItems) {
        return client.errNormal({ 
            error: `${user.username} doesn't have any items!`, 
            type: 'editreply' 
        }, interaction);
    }

    // Create embed
    const embed = new Discord.EmbedBuilder()
        .setTitle(`${user.username}'s Inventory`)
        .setColor(client.config?.color || 0x2F3136)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();

    // Add tools section if user has any tools
    const tools = [];
    if (userItems.FishingRod) tools.push(`🎣 Fishing Rod (Tier ${userItems.FishingRodTier}) - Used ${userItems.FishingRodUsage} times`);
    if (userItems.PickAxe) tools.push(`⛏️ Pickaxe (Tier ${userItems.PickAxeTier}) - Used ${userItems.PickAxeUsage} times`);
    if (userItems.Laptop) tools.push(`💻 Laptop (Tier ${userItems.LaptopTier}) - Used ${userItems.LaptopUsage} times`);
    if (userItems.Spatula) tools.push(`🍳 Spatula (Tier ${userItems.SpatulaTier}) - Used ${userItems.SpatulaUsage} times`);
    if (userItems.MedKit) tools.push(`🩹 Med Kit (Tier ${userItems.MedKitTier}) - Used ${userItems.MedKitUsage} times`);
    if (userItems.Hammer) tools.push(`🔨 Hammer (Tier ${userItems.HammerTier}) - Used ${userItems.HammerUsage} times`);

    if (tools.length > 0) {
        embed.addFields({ name: '🛠️ Tools', value: tools.join('\n'), inline: false });
    }

    // Add inventory items if user has any
    if (userItems.Inventory && userItems.Inventory.size > 0) {
        const inventoryItems = [];
        
        // Convert Map to array for easier processing
        const inventoryArray = Array.from(userItems.Inventory.entries());
        
        // Group items by type
        const fishItems = [];
        const collectibles = [];
        const otherItems = [];
        
        for (const [key, amount] of inventoryArray) {
            if (key.startsWith('fish_')) {
                // Format fish name (fish_Yellow_Fish -> Yellow Fish)
                const fishName = key.replace('fish_', '').replace(/_/g, ' ');
                
                // Find emoji for this fish
                let emoji = '🐟'; // Default emoji
                if (key.includes('Yellow')) emoji = '🐠';
                if (key.includes('Fat')) emoji = '🐡';
                if (key.includes('Blue')) emoji = '🐟';
                if (key.includes('Coconut')) emoji = '🥥';
                if (key.includes('Dolphin')) emoji = '🐬';
                if (key.includes('Lobster')) emoji = '🦞';
                if (key.includes('Shark')) emoji = '🦈';
                if (key.includes('Crab')) emoji = '🦀';
                if (key.includes('Squid')) emoji = '🦑';
                if (key.includes('Whale')) emoji = '🐋';
                if (key.includes('Shrimp')) emoji = '🦐';
                if (key.includes('Octopus')) emoji = '🐙';
                if (key.includes('Diamond')) emoji = '💎';
                
                fishItems.push(`${emoji} ${fishName} - ${amount}x`);
            } else if (key.startsWith('collectible_')) {
                const collectibleName = key.replace('collectible_', '').replace(/_/g, ' ');
                collectibles.push(`🏆 ${collectibleName} - ${amount}x`);
            } else {
                otherItems.push(`📦 ${key.replace(/_/g, ' ')} - ${amount}x`);
            }
        }
        
        // Add sections to embed
        if (fishItems.length > 0) {
            embed.addFields({ name: '🐟 Fish', value: fishItems.join('\n'), inline: false });
        }
        
        if (collectibles.length > 0) {
            embed.addFields({ name: '🏆 Collectibles', value: collectibles.join('\n'), inline: false });
        }
        
        if (otherItems.length > 0) {
            embed.addFields({ name: '📦 Other Items', value: otherItems.join('\n'), inline: false });
        }
    } else {
        embed.setDescription("This inventory is empty! Try fishing or buying items from the store.");
    }

    // Add footer with sell command info
    embed.setFooter({ text: 'Use /economy sell to sell items from your inventory' });

    // Send embed
    return client.embed({
        title: embed.data.title,
        desc: embed.data.description,
        fields: embed.data.fields,
        thumbnail: user.displayAvatarURL({ dynamic: true }),
        color: client.config?.color || 0x2F3136,
        footer: 'Use /economy sell to sell items from your inventory',
        type: 'editreply'
    }, interaction);
}