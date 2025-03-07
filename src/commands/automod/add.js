const Discord = require('discord.js');

const Schema = require("../../database/models/blacklist");

// Function to generate word variations
function generateVariations(word) {
    // Remove any non-alphanumeric characters and convert to lowercase
    const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    const variations = [
        cleanWord, // Original word
        cleanWord.replace(/a/gi, '@'), // Replace a with @
        cleanWord.replace(/a/gi, '4'), // Replace a with 4
        cleanWord.replace(/i/gi, '1'), // Replace i with 1
        cleanWord.replace(/o/gi, '0'), // Replace o with 0
        cleanWord.replace(/e/gi, '3'), // Replace e with 3
        cleanWord.replace(/s/gi, '$'), // Replace s with $
    ];

    // Add common censoring variations
    variations.push(
        '*'.repeat(cleanWord.length), // Replace with asterisks
        cleanWord.split('').map(() => '*').join('') // Another asterisk variation
    );

    // Remove duplicates
    return [...new Set(variations)];
}

module.exports = async (client, interaction, args) => {
    const word = interaction.options.getString('word');

    Schema.findOne({ Guild: interaction.guild.id }, async (err, data) => {
        if (data) {
            // Check if the exact word or any of its variations already exist
            const existingWordEntry = data.Words.find(w => 
                w.original.toLowerCase() === word.toLowerCase() || 
                w.variations.some(v => v.toLowerCase() === word.toLowerCase())
            );

            if (existingWordEntry) {
                return client.errNormal({
                    error: `That word or a variation of it already exists in the database!`,
                    type: 'editreply'
                }, interaction);
            }

            // Generate variations of the word
            const variations = generateVariations(word);

            // Push the new word with its variations
            data.Words.push({
                original: word,
                variations: variations
            });
            
            data.save();
        }
        else {
            // If no existing data, create a new entry
            const variations = generateVariations(word);
            
            new Schema({
                Guild: interaction.guild.id,
                Words: [{
                    original: word,
                    variations: variations
                }]
            }).save();
        }
    })

    client.succNormal({
        text: `Word is now blacklisted with its variations!`,
        fields: [
            {
                name: `💬┆Word`,
                value: `${word}`
            },
            {
                name: `🔤┆Variations`,
                value: generateVariations(word).join(', ')
            }
        ],
        type: 'editreply'
    }, interaction);
}
