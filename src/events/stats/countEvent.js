// File path: src/events/stats/countEvent.js
const CountSchema = require('../../database/models/count');

module.exports = async (client, message) => {
    // Ignore bot messages and DMs
    if (!message || !message.guild || message.author.bot) return;

    try {
        // Check if this channel is set up for counting
        const countingData = await CountSchema.findOne({
            guildId: message.guild.id,
            channelId: message.channel.id
        });

        // If this isn't a counting channel, ignore the message
        if (!countingData) return;

        // If message contains anything that's not a number, delete it
        if (!/^\d+$/.test(message.content)) {
            console.log('Deleting non-number message');
            await message.delete().catch(err => console.error('Error deleting message:', err));
            return;
        }

        const number = parseInt(message.content);

        // Check if the number is correct (next in sequence)
        if (number !== countingData.currentCount + 1) {
            console.log('Wrong number detected');
            const embed = {
                title: '❌ Game Over!',
                description: `${message.author} ruined it at ${countingData.currentCount}!\nThe next number should have been ${countingData.currentCount + 1}`,
                fields: [
                    { name: 'High Score', value: countingData.highScore.toString() }
                ],
                color: 0xff0000
            };
            await message.channel.send({ embeds: [embed] });
            countingData.currentCount = 0;
            countingData.lastUserId = null;
            countingData.lastThreeUsers = [];
            await countingData.save();
            return;
        }

        // Check for same user counting twice
        if (message.author.id === countingData.lastUserId) {
            console.log('Same user counted twice');
            await message.delete().catch(() => {});
            await message.channel.send({
                content: `${message.author}, you cannot count twice in a row!`
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
            return;
        }

        // Check for user in last three
        if (countingData.lastThreeUsers.includes(message.author.id)) {
            console.log('User in last three');
            await message.delete().catch(() => {});
            await message.channel.send({
                content: `${message.author}, please wait for at least 3 other users to count before counting again.`
            }).then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
            return;
        }

        // Update last three users
        countingData.lastThreeUsers.push(message.author.id);
        if (countingData.lastThreeUsers.length > 3) {
            countingData.lastThreeUsers.shift();
        }

        // Update count and save
        countingData.currentCount = number;
        if (number > countingData.highScore) {
            countingData.highScore = number;
        }
        countingData.lastUserId = message.author.id;
        await countingData.save();
        console.log('Count updated successfully');

        // React and send confirmation
        await message.react('✅').catch(() => {});

        // Check for milestone
        if (number % 100 === 0) {
            await message.channel.send({
                embeds: [{
                    title: '🎉 Milestone Reached!',
                    description: `Congratulations! You've reached ${number}!`,
                    color: 0x00ff00
                }]
            });
        }
    } catch (error) {
        console.error('Counting error:', error);
    }
};
