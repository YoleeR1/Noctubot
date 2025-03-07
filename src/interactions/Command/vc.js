const { CommandInteraction, Client } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vc')
        .setDescription('Voice Channel Management')
        .addSubcommand(subcommand => 
            subcommand
                .setName('publicvc')
                .setDescription('Make your voice channel public')
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName('privatevc')
                .setDescription('Make your voice channel private')
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName('permissiongrant')
                .setDescription('Grant a user access to your voice channel')
                .addUserOption(option => 
                    option
                        .setName('user')
                        .setDescription('User to grant access')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand => 
            subcommand
                .setName('permissionrevoke')
                .setDescription('Revoke a user\'s access to your voice channel')
                .addUserOption(option => 
                    option
                        .setName('user')
                        .setDescription('User to revoke access')
                        .setRequired(true)
                )
        ),

    run: async (client, interaction, args) => {
        try {
            await interaction.deferReply({ fetchReply: true });

            const subcommand = interaction.options.getSubcommand();

            // Dynamic command handling
            switch(subcommand) {
                case 'publicvc':
                case 'privatevc':
                case 'permissiongrant':
                case 'permissionrevoke': {
                    try {
                        const vcCommand = require(path.join(__dirname, '..', '..', 'commands', 'VoiceChannel', 'vc.js'));
                        await vcCommand.execute(interaction);
                    } catch (vcError) {
                        console.error('VC command error:', vcError);
                        await interaction.editReply({
                            content: 'Failed to execute voice channel command. Please contact support.',
                            ephemeral: true
                        });
                    }
                    break;
                }
                default: {
                    try {
                        await client.loadSubcommands(client, interaction, args);
                    } catch (loadError) {
                        console.error('Subcommand load error:', loadError);
                        await interaction.editReply({
                            content: 'An error occurred while processing the command.',
                            ephemeral: true
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Voice Channel command error:', error);
            try {
                await interaction.editReply({
                    content: 'An unexpected error occurred.',
                    ephemeral: true
                });
            } catch (replyError) {
                console.error('Error replying to interaction:', replyError);
            }
        }
    },
};
