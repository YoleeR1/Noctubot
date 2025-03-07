const { SlashCommandBuilder } = require('discord.js');
const CountSchema = require('../../database/models/count');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('count')
        .setDescription('Manage the counting game')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup the counting channel')
                .addChannelOption(option =>
                    option
                        .setName('channel')
                        .setDescription('The channel to use for counting')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('View counting statistics')
        ),
    run: async (client, interaction, args) => {
        if (!interaction.member.permissions.has('ManageChannels')) {
            return interaction.reply({ 
                content: 'You need Manage Channels permission to use this command!', 
                ephemeral: true 
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'setup') {
            const channel = interaction.options.getChannel('channel');
            await CountSchema.findOneAndUpdate(
                { guildId: interaction.guild.id },
                {
                    guildId: interaction.guild.id,
                    channelId: channel.id,
                    currentCount: 0,
                    lastUserId: null,
                    lastThreeUsers: []
                },
                { upsert: true }
            );
            return interaction.reply(`Counting channel has been set to ${channel}`);
        }

        if (subcommand === 'stats') {
            const stats = await CountSchema.findOne({ guildId: interaction.guild.id });
            if (!stats) {
                return interaction.reply('No counting game has been setup yet!');
            }
            
            // Send stats message and delete after 10 seconds
            const message = await interaction.reply({
                embeds: [{
                    title: 'Counting Statistics',
                    fields: [
                        { name: 'Current Count', value: stats.currentCount.toString(), inline: true },
                        { name: 'High Score', value: stats.highScore?.toString() || '0', inline: true },
                        { name: 'Counting Channel', value: `<#${stats.channelId}>`, inline: true }
                    ],
                    color: 0x00ff00
                }],
                fetchReply: true
            });
            
            // Delete the message after 10 seconds
            setTimeout(async () => {
                try {
                    // Check if the channel and message still exist
                    if (interaction.channel) {
                        const fetchedMessage = await interaction.channel.messages.fetch(message.id).catch(() => null);
                        if (fetchedMessage) {
                            await fetchedMessage.delete();
                        }
                    }
                } catch (error) {
                    console.error('Error deleting stats message:', error.message);
                }
            }, 10000);
            
            return;
        }
    }
};
