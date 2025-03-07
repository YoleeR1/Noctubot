const Discord = require('discord.js');
const Schema = require("../../database/models/economy");
const { formatCurrency, parseCurrency } = require("../../assets/utils/currencyFormatter");

module.exports = async (client, interaction, args) => {
    const action = interaction.options.getString('action');
    const amount = parseCurrency(interaction.options.getString('amount'));
    const user = interaction.user;

    if (amount <= 0) {
        return client.errNormal({ 
            error: `You cannot ${action} a negative or zero amount!`, 
            type: 'editreply' 
        }, interaction);
    }

    try {
        // Get user's economy data
        const data = await Schema.findOne({ Guild: interaction.guild.id, User: user.id });
        if (!data) {
            return client.errNormal({ 
                error: `You don't have any ${client.emotes.economy.coins}!`, 
                type: 'editreply' 
            }, interaction);
        }

        if (action === 'deposit') {
            // Check if user has enough money
            if (amount > data.Money) {
                return client.errNormal({ 
                    error: `You don't have that much money to deposit!`, 
                    type: 'editreply' 
                }, interaction);
            }

            // Use client functions to update money and bank
            // These functions will automatically update economy stats
            await client.removeMoney(interaction, user, amount);
            await client.addBank(interaction, user, amount);
            
            // Refresh data to get updated values
            const updatedData = await Schema.findOne({ Guild: interaction.guild.id, User: user.id });

            return client.succNormal({ 
                text: `You have deposited ${client.emotes.economy.coins} $${formatCurrency(amount)} into your bank!`,
                fields: [
                    {
                        name: `${client.emotes.economy.coins} Wallet`,
                        value: `$${formatCurrency(updatedData.Money)}`,
                        inline: true
                    },
                    {
                        name: `${client.emotes.economy.bank} Bank`,
                        value: `$${formatCurrency(updatedData.Bank)}`,
                        inline: true
                    }
                ],
                type: 'editreply' 
            }, interaction);
        } 
        else if (action === 'withdraw') {
            // Check if user has enough money in bank
            if (amount > data.Bank) {
                return client.errNormal({ 
                    error: `You don't have that much money in your bank!`, 
                    type: 'editreply' 
                }, interaction);
            }

            // Use client functions to update money and bank
            // These functions will automatically update economy stats
            await client.addMoney(interaction, user, amount);
            await client.removeBank(interaction, user, amount);
            
            // Refresh data to get updated values
            const updatedData = await Schema.findOne({ Guild: interaction.guild.id, User: user.id });

            return client.succNormal({ 
                text: `You have withdrawn ${client.emotes.economy.coins} $${formatCurrency(amount)} from your bank!`,
                fields: [
                    {
                        name: `${client.emotes.economy.coins} Wallet`,
                        value: `$${formatCurrency(updatedData.Money)}`,
                        inline: true
                    },
                    {
                        name: `${client.emotes.economy.bank} Bank`,
                        value: `$${formatCurrency(updatedData.Bank)}`,
                        inline: true
                    }
                ],
                type: 'editreply' 
            }, interaction);
        }
    } catch (error) {
        console.error("Error in bank command:", error);
        return client.errNormal({ 
            error: "An error occurred while processing your transaction.", 
            type: 'editreply' 
        }, interaction);
    }
}