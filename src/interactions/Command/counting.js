// File path: /src/interactions/Command/counting.js

const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const CountSchema = require('../../database/models/count');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('count')
        .setDescription('Manage the counting system')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup the counting channel')
                .addChannelOption(option =>
                    option.setName('channel')
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
        await interaction.deferReply({ fetchReply: true });

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'setup': {
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                    return interaction.editReply({ content: 'You need Manage Channels permission to use this command!', ephemeral: true });
                }

                const channel = interaction.options.getChannel('channel');

                try {
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

                    return interaction.editReply(`✅ Counting channel has been set to ${channel}`);
                } catch (error) {
                    console.error('Counting setup error:', error);
                    return interaction.editReply({ content: 'An error occurred while setting up the counting channel!', ephemeral: true });
                }
            }

            case 'stats': {
                try {
                    const stats = await CountSchema.findOne({ guildId: interaction.guild.id });
                    if (!stats) {
                        return interaction.editReply('No counting game has been setup yet!');
                    }

                    const embed = {
                        title: '📊 Counting Statistics',
                        fields: [
                            { name: 'Current Count', value: stats.currentCount.toString(), inline: true },
                            { name: 'High Score', value: stats.highScore.toString(), inline: true },
                            { name: 'Counting Channel', value: `<#${stats.channelId}>`, inline: true }
                        ],
                        color: 0x00ff00
                    };

                    return interaction.editReply({ embeds: [embed] });
                } catch (error) {
                    console.error('Stats fetch error:', error);
                    return interaction.editReply({ content: 'An error occurred while fetching statistics!', ephemeral: true });
                }
            }
        }
    }
};
