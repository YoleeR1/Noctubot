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
    const suggestion = interaction.options.getString('suggestion');
    try {
        const guildSetup = await Schema.findOne({ Guild: interaction.guild.id });
        if (!guildSetup) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#f0b3fe')
                .setDescription('❌ Suggestions have not been set up in this server!')
            return interaction.editReply({ embeds: [errorEmbed] }).then(msg => {
                setTimeout(() => interaction.deleteReply().catch(e => {}), 5000)
            });
        }

        // Check cooldown
        const lastSuggestion = await SuggestionSchema.findOne({
            Guild: interaction.guild.id,
            Author: interaction.user.id
        }).sort({ LastSuggestionTime: -1 }); // Get the most recent suggestion

        if (lastSuggestion && lastSuggestion.LastSuggestionTime) {
            const cooldownDuration = guildSetup.CooldownDuration || 86400000; // 24 hours in milliseconds
            const timeElapsed = Date.now() - new Date(lastSuggestion.LastSuggestionTime).getTime();
            
            if (timeElapsed < cooldownDuration) {
                const timeLeft = cooldownDuration - timeElapsed;
                const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
                
                const errorEmbed = new EmbedBuilder()
                    .setColor('#f0b3fe')
                    .setDescription(`❌ You can only make one suggestion every 24 hours.\nPlease wait ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} before making another suggestion.`)
                return interaction.editReply({ embeds: [errorEmbed] }).then(msg => {
                    setTimeout(() => interaction.deleteReply().catch(e => {}), 5000)
                });
            }
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

        // Generate a unique suggestion ID (timestamp + random numbers)
        const suggestionId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const embed = new EmbedBuilder()
            .setColor('#f0b3fe')
            .setAuthor({
                name: `${interaction.user.tag} suggested:`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setDescription(suggestion)
            .setFooter({ text: `Suggestion ID: ${suggestionId}` })
            .setTimestamp();

        const message = await channel.send({ embeds: [embed] });
        await message.react('👍');
        await message.react('👎');

        // Save the suggestion to the database with the current timestamp
        await SuggestionSchema.create({
            Guild: interaction.guild.id,
            MessageId: message.id,
            Author: interaction.user.id,
            Suggestion: suggestion,
            SuggestionId: suggestionId,
            LastSuggestionTime: new Date()
        });

        // Log the new suggestion
        if (guildSetup.LogChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor('#f0b3fe')
                .setTitle('New Suggestion')
                .addFields(
                    { name: 'Author', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
                    { name: 'Suggestion ID', value: suggestionId, inline: true },
                    { name: 'Content', value: suggestion }
                )
                .setTimestamp();

            await sendLog(interaction.guild, guildSetup.LogChannel, logEmbed);
        }

        const successEmbed = new EmbedBuilder()
            .setColor('#f0b3fe')
            .setDescription(`✅ Your suggestion has been posted in ${channel}!\nSuggestion ID: ${suggestionId}`)
        return interaction.editReply({ embeds: [successEmbed] }).then(msg => {
            setTimeout(() => interaction.deleteReply().catch(e => {}), 5000)
        });
    } catch (error) {
        console.error('Error in suggest command:', error);
        const errorEmbed = new EmbedBuilder()
            .setColor('#f0b3fe')
            .setDescription('❌ An error occurred while creating your suggestion.')
        return interaction.editReply({ embeds: [errorEmbed] }).then(msg => {
            setTimeout(() => interaction.deleteReply().catch(e => {}), 5000)
        });
    }
};
