const Discord = require('discord.js');

const Schema = require("../../database/models/economy");
const { formatCurrency, parseCurrency } = require("../../assets/utils/currencyFormatter");

module.exports = async (client, interaction, args) => {
    let user = interaction.user;
    
    // More sophisticated crash point calculation
    // Uses exponential distribution for more realistic gambling odds
    // Lower numbers are more common, high multipliers are rare
    function generateCrashPoint() {
        // Random number between 0 and 1
        const rand = Math.random();
        
        // Increased early crash chance (35% chance to crash before 2x)
        if (rand < 0.35) {
            return Math.random() * 1.8 + 1; // Crash between 1x and 1.8x
        }
        
        // Normal distribution with exponential falloff for higher values
        // This creates a more realistic gambling curve
        const baseMultiplier = -Math.log(1.0 - rand) + 1;
        
        // Reduced multiplier scale and max cap
        return Math.min(baseMultiplier * 3.5, 12);
    }

    try {
        // Find user data using async/await
        const data = await Schema.findOne({ Guild: interaction.guild.id, User: user.id });
        
        if (!data) {
            return client.errNormal({ error: `You have no ${client.emotes.economy.coins}!`, type: 'editreply' }, interaction);
        }
        
        let money = parseCurrency(interaction.options.getString('amount'));
        if (!money) return client.errUsage({ usage: "crash [amount]", type: 'editreply' }, interaction);

        if (money > data.Money) return client.errNormal({ error: `You are betting more than you have!`, type: 'editreply' }, interaction);

        const row = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('crash_stop')
                    .setEmoji("🛑")
                    .setStyle(Discord.ButtonStyle.Danger),
            );

        const disableRow = new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('crash_stop')
                    .setEmoji("🛑")
                    .setStyle(Discord.ButtonStyle.Danger)
                    .setDisabled(true),
            );

        // Generate crash point
        const crashPoint = generateCrashPoint();
        
        // Initial embed
        const msg = await interaction.editReply({
            embeds: [
                client.templateEmbed()
                    .setDescription(`Crash started by ${user}・React 🛑 to stop`)
                    .addFields(
                        { name: `Multiplier`, value: `1x`, inline: true },
                        { name: `Profit`, value: `**$0**`, inline: true }
                    )
            ],
            components: [row]
        });
        
        // Game state
        let multiplier = 1;
        let gameActive = true;
        let gameEnded = false;
        
        // Create collector for button interaction
        const collector = msg.createMessageComponentCollector({ 
            filter: i => i.user.id === user.id && i.customId === 'crash_stop',
            time: 60000 // 1 minute max game time
        });
        
        // Handle button click
        collector.on('collect', async (i) => {
            if (!gameActive || gameEnded) return;
            
            gameActive = false;
            gameEnded = true;
            collector.stop();
            
            try {
                await i.deferUpdate();
                
                // Calculate profit
                const profit = Math.floor(money * multiplier);
                const winnings = profit - money;
                
                // Update user's money
                const userData = await Schema.findOne({ Guild: interaction.guild.id, User: user.id });
                if (userData) {
                    userData.Money += winnings;
                    await userData.save();
                }
                
                // Show results
                await i.editReply({
                    embeds: [
                        client.templateEmbed()
                            .setDescription(`Crash Results of ${user}`)
                            .addFields(
                                { name: `Profit`, value: `**$${formatCurrency(winnings)}**`, inline: false },
                                { name: `Would have crashed at`, value: `${crashPoint.toFixed(2)}x`, inline: false }
                            )
                    ],
                    components: [disableRow]
                });
            } catch (error) {
                console.error("Error in crash button handler:", error);
            }
        });
        
        // Handle game end (timeout or crash)
        collector.on('end', async (collected, reason) => {
            if (gameEnded) return; // Already handled by button click
            
            gameActive = false;
            gameEnded = true;
            
            try {
                // User lost - update money
                const userData = await Schema.findOne({ Guild: interaction.guild.id, User: user.id });
                if (userData) {
                    userData.Money -= money;
                    await userData.save();
                }
                
                // Show crash results
                await interaction.editReply({
                    embeds: [
                        client.templateEmbed()
                            .setDescription(`Crash Results of ${user}`)
                            .addFields(
                                { name: `Loss`, value: `**$${formatCurrency(money)}**`, inline: false },
                                { name: `Crashed at`, value: `${crashPoint.toFixed(2)}x`, inline: false }
                            )
                    ],
                    components: [disableRow]
                });
            } catch (error) {
                console.error("Error in crash end handler:", error);
            }
        });
        
        // Game loop with fixed interval
        const gameLoop = async () => {
            if (!gameActive) return;
            
            // Increase multiplier (slower rate)
            multiplier += 0.15;
            multiplier = parseFloat(multiplier.toFixed(2)); // Fix precision issues
            
            // Calculate profit
            const profit = (money * multiplier) - money;
            
            // Check if crashed
            if (multiplier >= crashPoint) {
                gameActive = false;
                collector.stop();
                return;
            }
            
            // Update embed
            try {
                await interaction.editReply({
                    embeds: [
                        client.templateEmbed()
                            .setDescription(`Crash started by ${user}・React 🛑 to stop`)
                            .addFields(
                                { name: `Multiplier`, value: `${multiplier.toFixed(1)}x`, inline: true },
                                { name: `Profit`, value: `**$${formatCurrency(profit)}**`, inline: true }
                            )
                    ],
                    components: [row]
                });
                
                // Continue game loop
                if (gameActive) {
                    setTimeout(gameLoop, 1000); // Fixed 1 second interval for reliability
                }
            } catch (error) {
                console.error("Error updating crash game:", error);
                gameActive = false;
                collector.stop();
            }
        };
        
        // Start game loop
        setTimeout(gameLoop, 1000);
        
    } catch (error) {
        console.error("Error in crash game:", error);
        return client.errNormal({ error: "An error occurred while playing crash. Please try again.", type: 'editreply' }, interaction);
    }
}