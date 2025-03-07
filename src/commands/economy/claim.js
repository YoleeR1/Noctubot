const Discord = require('discord.js');
const Schema = require("../../database/models/economy");
const Timeout = require("../../database/models/economyTimeout");
const { formatCurrency } = require("../../assets/utils/currencyFormatter");

module.exports = async (client, interaction, args) => {
    const period = interaction.options.getString('period');
    const user = interaction.user;

    // Define cooldowns and rewards for each period
    const periodConfig = {
        hourly: {
            cooldown: 60 * 60 * 1000, // 1 hour
            reward: 50,
            timeoutField: 'Hourly',
            emoji: '⏰'
        },
        daily: {
            cooldown: 24 * 60 * 60 * 1000, // 24 hours
            reward: 200,
            timeoutField: 'Daily',
            emoji: '📅'
        },
        weekly: {
            cooldown: 7 * 24 * 60 * 60 * 1000, // 7 days
            reward: 1000,
            timeoutField: 'Weekly',
            emoji: '📆'
        },
        monthly: {
            cooldown: 30 * 24 * 60 * 60 * 1000, // 30 days
            reward: 5000,
            timeoutField: 'Monthly',
            emoji: '📅'
        },
        yearly: {
            cooldown: 365 * 24 * 60 * 60 * 1000, // 365 days
            reward: 25000,
            timeoutField: 'Yearly',
            emoji: '🎊'
        }
    };

    // Get config for the requested period
    const config = periodConfig[period];
    if (!config) {
        return client.errNormal({ 
            error: "Invalid period specified.", 
            type: 'editreply' 
        }, interaction);
    }

    try {
        // Check if user is on cooldown
        const timeout = await Timeout.findOne({ 
            Guild: interaction.guild.id, 
            User: user.id 
        });

        const now = Date.now();
        if (timeout && timeout[config.timeoutField]) {
            const lastClaim = new Date(timeout[config.timeoutField]).getTime();
            const timeLeft = lastClaim + config.cooldown - now;
            
            if (timeLeft > 0) {
                // User is on cooldown
                const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
                
                return client.errNormal({ 
                    error: `You can claim your ${period} reward in ${hours}h ${minutes}m ${seconds}s`, 
                    type: 'editreply' 
                }, interaction);
            }
        }

        // Set reward (inflation calculation removed as function is missing)
        let reward = config.reward;

        // Add money to user
        await client.addMoney(interaction, user, reward);

        // Update timeout
        if (timeout) {
            timeout[config.timeoutField] = new Date(now);
            await timeout.save();
        } else {
            const newTimeout = new Timeout({
                Guild: interaction.guild.id,
                User: user.id
            });
            newTimeout[config.timeoutField] = new Date(now);
            await newTimeout.save();
        }

        // Get user's new balance
        const data = await Schema.findOne({ 
            Guild: interaction.guild.id, 
            User: user.id 
        });

        return client.succNormal({ 
            text: `You claimed your ${period} reward of ${client.emotes.economy.coins} $${formatCurrency(reward)}!`,
            fields: [
                {
                    name: `${client.emotes.economy.coins} Wallet`,
                    value: `$${formatCurrency(data.Money)}`,
                    inline: true
                },
                {
                    name: `${client.emotes.economy.bank} Bank`,
                    value: `$${formatCurrency(data.Bank)}`,
                    inline: true
                }
            ],
            type: 'editreply' 
        }, interaction);
    } catch (error) {
        console.error(`Error in ${period} command:`, error);
        return client.errNormal({ 
            error: "An error occurred while processing your reward.", 
            type: 'editreply' 
        }, interaction);
    }
}