const Discord = require('discord.js');

const Schema = require("../../database/models/blacklist");

module.exports = async (client, interaction, args) => {
    const word = interaction.options.getString('word');

    Schema.findOne({ Guild: interaction.guild.id }, async (err, data) => {
        if (data) {
            // Find the index of the word entry
            const wordIndex = data.Words.findIndex(w => 
                w.original.toLowerCase() === word.toLowerCase()
            );

            if (wordIndex === -1) {
                return client.errNormal({
                    error: `That word doesn't exist in the database!`,
                    type: 'editreply'
                }, interaction);
            }

            // Remove the word entry
            const removedWord = data.Words[wordIndex];
            data.Words.splice(wordIndex, 1);

            // Save the updated data
            await data.save();

            client.succNormal({
                text: `Word is removed from the blacklist!`,
                fields: [
                    {
                        name: `💬┆Word`,
                        value: `${removedWord.original}`
                    },
                    {
                        name: `🔤┆Removed Variations`,
                        value: removedWord.variations.join(', ')
                    }
                ],
                type: 'editreply'
            }, interaction);
        }
        else {
            client.errNormal({
                error: `This guild has no blacklisted words!`,
                type: 'editreply'
            }, interaction);
        }
    })
}
