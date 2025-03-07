const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const Schema = require('../../database/models/suggestionChannels');

const sendLog = async (guild, logChannelId, embed) => {
    if (!logChannelId) return;
    
    try {
        const logChannel = guild.channels.cache.get(logChannelId);
        if (logChannel?.isTextBased()) {
            await logChannel.send({ embeds: [embed] });
            return true;
        }
    } catch (error) {
        console.error('Logging error:', error);
    }
    return false;
};

module.exports = async (client, interaction) => {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#f0b3fe')
            .setDescription('❌ You need the "Manage Server" permission to use this command!')
        return interaction.editReply({ embeds: [errorEmbed] }).then(msg => {
            setTimeout(() => interaction.deleteReply().catch(e => {}), 5000)
        });
    }
    const channel = interaction.options.getChannel('channel');
    const logChannel = interaction.options.getChannel('logs');

    if (!channel.isTextBased()) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#f0b3fe')
            .setDescription('❌ The suggestions channel must be a text channel!')
        return interaction.editReply({ embeds: [errorEmbed] }).then(msg => {
            setTimeout(() => interaction.deleteReply().catch(e => {}), 5000)
        });
    }

    if (logChannel && !logChannel.isTextBased()) {
        const errorEmbed = new EmbedBuilder()
            .setColor('#f0b3fe')
            .setDescription('❌ The logs channel must be a text channel!')
        return interaction.editReply({ embeds: [errorEmbed] }).then(msg => {
            setTimeout(() => interaction.deleteReply().catch(e => {}), 5000)
        });
    }

    try {
        let guildSetup = await Schema.findOne({ Guild: interaction.guild.id });
        if (guildSetup) {
            await Schema.findOneAndUpdate({ Guild: interaction.guild.id }, {
                Channel: channel.id,
                LogChannel: logChannel?.id || guildSetup.LogChannel
            });
        } else {
            await Schema.create({
                Guild: interaction.guild.id,
                Channel: channel.id,
                LogChannel: logChannel?.id
            });
        }

        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor('#f0b3fe')
                .setTitle('Suggestion System Setup')
                .addFields(
                    { name: 'Setup by', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
                    { name: 'Suggestions Channel', value: `<#${channel.id}>`, inline: true },
                    { name: 'Logs Channel', value: `<#${logChannel.id}>`, inline: true }
                )
                .setTimestamp();
            
            await sendLog(interaction.guild, logChannel.id, logEmbed);
        }

        const successEmbed = new EmbedBuilder()
            .setColor('#f0b3fe')
            .setDescription(`✅ Successfully set up suggestions in ${channel}${logChannel ? ` with logs in ${logChannel}` : ''}!`)
        return interaction.editReply({ embeds: [successEmbed] }).then(msg => {
            setTimeout(() => interaction.deleteReply().catch(e => {}), 5000)
        });
    } catch (error) {
        console.error('Error in setup command:', error);
        const errorEmbed = new EmbedBuilder()
            .setColor('#f0b3fe')
            .setDescription('❌ An error occurred while setting up the suggestions channel.')
        return interaction.editReply({ embeds: [errorEmbed] }).then(msg => {
            setTimeout(() => interaction.deleteReply().catch(e => {}), 5000)
        });
    }
};
