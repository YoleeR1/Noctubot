const Discord = require('discord.js');
const ms = require("ms");

const Schema = require("../../database/models/economy");
const Schema2 = require("../../database/models/economyTimeout");
const itemSchema = require("../../database/models/economyItems");

module.exports = async (client, interaction, args) => {

    const rand = (min, max) => {
        return Math.floor(Math.random() * (max - min)) + min;
    };

    let user = interaction.user;

    let timeout = 60000;
    let huntItems = [
        { name: "Rabbit", emoji: ":rabbit:", value: 15 },
        { name: "Frog", emoji: ":frog:", value: 8 },
        { name: "Monkey", emoji: ":monkey:", value: 25 },
        { name: "Chicken", emoji: ":chicken:", value: 12 },
        { name: "Wolf", emoji: ":wolf:", value: 35 },
        { name: "Rooster", emoji: ":rooster:", value: 10 },
        { name: "Turkey", emoji: ":turkey:", value: 20 },
        { name: "Chipmunk", emoji: ":chipmunk:", value: 5 },
        { name: "Water Buffalo", emoji: ":water_buffalo:", value: 40 },
        { name: "Race Horse", emoji: ":racehorse:", value: 50 },
        { name: "Pig", emoji: ":pig:", value: 18 },
        { name: "Snake", emoji: ":snake:", value: 30 },
        { name: "Cow", emoji: ":cow:", value: 22 }
    ];

    let randn = rand(0, parseInt(huntItems.length));
    let animalCaught = huntItems[randn];
    let huntToWin = `${animalCaught.emoji} ${animalCaught.name}`;

    try {
        // Check for timeout
        const dataTime = await Schema2.findOne({ Guild: interaction.guild.id, User: user.id });
        
        if (dataTime && dataTime.Hunt !== null && timeout - (Date.now() - dataTime.Hunt) > 0) {
            let time = (dataTime.Hunt / 1000 + timeout / 1000).toFixed(0);
            return client.errWait({ time: time, type: 'editreply' }, interaction);
        }
        
        // Get or create user items
        let userItems = await itemSchema.findOne({ Guild: interaction.guild.id, User: user.id });
        if (!userItems) {
            userItems = new itemSchema({
                Guild: interaction.guild.id,
                User: user.id
            });
        }
        
        // Add animal to inventory
        const animalKey = `animal_${animalCaught.name.replace(/\s+/g, '_')}`;
        if (!userItems.Inventory) userItems.Inventory = new Map();
        
        const currentAmount = userItems.Inventory.get(animalKey) || 0;
        userItems.Inventory.set(animalKey, currentAmount + 1);
        
        await userItems.save();
        
        // Update timeout
        if (dataTime) {
            dataTime.Hunt = Date.now();
            await dataTime.save();
        } else {
            await new Schema2({
                Guild: interaction.guild.id,
                User: user.id,
                Hunt: Date.now()
            }).save();
        }
        
        // Send success message
        client.succNormal({ 
            text: `You've hunted and caught a ${huntToWin}!\nIt has been added to your inventory.`, 
            type: 'editreply' 
        }, interaction);
        
    } catch (error) {
        console.error("Error in hunt command:", error);
        client.errNormal({ 
            error: "Something went wrong while hunting!", 
            type: 'editreply' 
        }, interaction);
    }
}