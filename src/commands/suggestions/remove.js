const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const Schema = require('../../database/models/suggestionChannels');
const SuggestionSchema = require('../../database/models/suggestions');

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
    const suggestionId = interaction.options.getString('id');
    try {
        const suggestion = await SuggestionSchema.findOne({
            Guild: interaction.guild.id,
            SuggestionId: suggestionId
        });
        if (!suggestion) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#f0b3fe')
                .setDescription('❌ Suggestion not found!')
            return interaction.editReply({ embeds: [errorEmbed] }).then(msg => {
                setTimeout(() => interaction.deleteReply().catch(e => {}), 5000)
            });
        }

        const hasPermission = interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages);
        if (suggestion.Author !== interaction.user.id && !hasPermission) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#f0b3fe')
                .setDescription('❌ You can only remove your own suggestions unless you have the Manage Messages permission!')
            return interaction.editReply({ embeds: [errorEmbed] }).then(msg => {
                setTimeout(() => interaction.deleteReply().catch(e => {}), 5000)
            });
        }

        const guildSetup = await Schema.findOne({ Guild: interaction.guild.id });
        if (!guildSetup) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#f0b3fe')
                .setDescription('❌ Suggestions system is not set up in this server!')
            return interaction.editReply({ embeds: [errorEmbed] }).then(msg => {
                setTimeout(() => interaction.deleteReply().catch(e => {}), 5000)
            });
        }

        const channel = interaction.guild.channels.cache.get(guildSetup.Channel);
        if (channel) {
            try {
                const message = await channel.messages.fetch(suggestion.MessageId);
                if (message) await message.delete().catch(e => console.error('Error deleting message:', e));
            } catch (error) {
                console.log('Message already deleted or not found');
            }
        }

        if (guildSetup.LogChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor('#f0b3fe')
                .setTitle('Suggestion Removed')
                .addFields(
                    { name: 'Removed by', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
                    { name: 'Original Author', value: `<@${suggestion.Author}>`, inline: true },
                    { name: 'Suggestion ID', value: suggestionId, inline: true },
                    { name: 'Content', value: suggestion.Suggestion }
                )
                .setTimestamp();
            
            await sendLog(interaction.guild, guildSetup.LogChannel, logEmbed);
        }

        await SuggestionSchema.findOneAndDelete({
            Guild: interaction.guild.id,
            SuggestionId: suggestionId
        });

        const successEmbed = new EmbedBuilder()
            .setColor('#f0b3fe')
            .setDescription('✅ Successfully removed the suggestion!')
        return interaction.editReply({ embeds: [successEmbed] }).then(msg => {
            setTimeout(() => interaction.deleteReply().catch(e => {}), 5000)
        });
    } catch (error) {
        console.error('Error in remove command:', error);
        const errorEmbed = new EmbedBuilder()
            .setColor('#f0b3fe')
            .setDescription('❌ An error occurred while removing the suggestion.')
        return interaction.editReply({ embeds: [errorEmbed] }).then(msg => {
            setTimeout(() => interaction.deleteReply().catch(e => {}), 5000)
        });
    }
};
