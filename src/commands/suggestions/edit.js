const { EmbedBuilder } = require('discord.js');
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
    const newSuggestion = interaction.options.getString('new_suggestion');

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

        if (suggestion.Author !== interaction.user.id) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#f0b3fe')
                .setDescription('❌ You can only edit your own suggestions!')
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
        if (!channel || !channel.isTextBased()) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#f0b3fe')
                .setDescription('❌ The suggestions channel has been deleted or is invalid!')
            return interaction.editReply({ embeds: [errorEmbed] }).then(msg => {
                setTimeout(() => interaction.deleteReply().catch(e => {}), 5000)
            });
        }

        try {
            const message = await channel.messages.fetch(suggestion.MessageId);

            const embed = new EmbedBuilder()
                .setColor('#f0b3fe')
                .setAuthor({
                    name: `${interaction.user.tag} suggested:`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setDescription(newSuggestion)
                .setFooter({ text: `Suggestion ID: ${suggestionId} (Edited)` })
                .setTimestamp();

            await message.edit({ embeds: [embed] });

            if (guildSetup.LogChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor('#f0b3fe')
                    .setTitle('Suggestion Edited')
                    .addFields(
                        { name: 'Author', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
                        { name: 'Suggestion ID', value: suggestionId, inline: true },
                        { name: 'Original Suggestion', value: suggestion.Suggestion },
                        { name: 'New Suggestion', value: newSuggestion }
                    )
                    .setTimestamp();
                
                await sendLog(interaction.guild, guildSetup.LogChannel, logEmbed);
            }

            await SuggestionSchema.findOneAndUpdate(
                { Guild: interaction.guild.id, SuggestionId: suggestionId },
                { Suggestion: newSuggestion }
            );

            const successEmbed = new EmbedBuilder()
                .setColor('#f0b3fe')
                .setDescription('✅ Successfully edited your suggestion!')
            return interaction.editReply({ embeds: [successEmbed] }).then(msg => {
                setTimeout(() => interaction.deleteReply().catch(e => {}), 5000)
            });
        } catch (error) {
            console.error('Error in edit command:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#f0b3fe')
                .setDescription('❌ Could not find the suggestion message. It may have been deleted.')
            return interaction.editReply({ embeds: [errorEmbed] }).then(msg => {
                setTimeout(() => interaction.deleteReply().catch(e => {}), 5000)
            });
        }
    } catch (error) {
        console.error('Error in edit command:', error);
        const errorEmbed = new EmbedBuilder()
            .setColor('#f0b3fe')
            .setDescription('❌ An error occurred while editing your suggestion.')
        return interaction.editReply({ embeds: [errorEmbed] }).then(msg => {
            setTimeout(() => interaction.deleteReply().catch(e => {}), 5000)
        });
    }
};
