const Discord = require('discord.js');

const ticketSchema = require("../../database/models/tickets");
const ticketChannels = require("../../database/models/ticketChannels");

module.exports = async (client, interaction, args) => {
    const data = await ticketSchema.findOne({ Guild: interaction.guild.id });
    const ticketData = await ticketChannels.findOne({ Guild: interaction.guild.id, channelID: interaction.channel.id });

    let type = 'reply';
    if (interaction.isCommand()) type = 'editreply';
    
    // First check if this is a valid ticket channel
    if (!ticketData) {
        return client.errNormal({
            error: "This is not a ticket channel!",
            type: type
        }, interaction);
    }

    // Check if user is the ticket creator
    if (interaction.user.id === ticketData.creator) {
        return client.errNormal({
            error: "You cannot claim your own ticket!",
            type: 'ephemeral'
        }, interaction);
    }

    // Check if ticket system is set up
    if (!data) {
        return client.errNormal({
            error: "Do the ticket setup!",
            type: type
        }, interaction);
    }

    // Check if ticket is already claimed
    if (ticketData.claimed && ticketData.claimed !== "None" && ticketData.claimed !== "") {
        return client.errNormal({
            error: "Ticket has already been claimed!",
            type: 'ephemeral'
        }, interaction);
    }

    // Verify ticket is in the correct category
    const ticketCategory = interaction.guild.channels.cache.get(data.Category);
    if (!ticketCategory) {
        return client.errNormal({
            error: "Do the ticket setup!",
            type: type
        }, interaction);
    }

    if (interaction.channel.parentId !== ticketCategory.id) {
        return client.errNormal({
            error: "This is not a ticket!",
            type: type
        }, interaction);
    }

    try {
        // Claim the ticket
        ticketData.claimed = interaction.user.id;
        await ticketData.save();

        return client.simpleEmbed({
            desc: `You will now be assisted by <@!${interaction.user.id}>`,
            type: type
        }, interaction);
    } catch (error) {
        console.error('Error claiming ticket:', error);
        return client.errNormal({
            error: "Failed to claim ticket. Please try again.",
            type: 'ephemeral'
        }, interaction);
    }
}