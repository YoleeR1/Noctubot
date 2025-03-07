// src/events/message/countingGame.js
const CountModel = require('../../database/models/count');

module.exports = async (client, message) => {
    if (message.author.bot || !message.guild) return;

    try {
        // Get the counting channel data for this guild
        const countData = await CountModel.findOne({ guildId: message.guild.id });
        
        if (!countData || countData.channelId !== message.channel.id) {
            return;
        }

        // Check if the message contains ONLY numbers (no letters, spaces, or other characters)
        if (!/^\d+$/.test(message.content)) {
            // Message contains non-digit characters, delete it
            await message.delete().catch(() => {});
            return;
        }
        
        // Convert message to number
        const number = parseInt(message.content);

        // Check if this is the next number in sequence
        if (number !== countData.currentCount + 1) {
            // Delete the message with the wrong number
            await message.delete().catch(() => {});
            
            // Send notification and delete after 3 seconds
            const reply = await message.channel.send({
                content: `<@${message.author.id}>, wrong number! The count has been reset to 0.`
            }).catch(() => {});
                
            if (reply) {
                setTimeout(() => {
                    reply.delete().catch(() => {});
                }, 3000);
            }
            
            // Reset the count to 0 when wrong number is provided
            await CountModel.findOneAndUpdate(
                { guildId: message.guild.id },
                {
                    currentCount: 0,
                    lastUserId: null,
                    lastThreeUsers: []
                }
            );
            
            return;
        }

        // Check if user is trying to count twice in a row
        if (message.author.id === countData.lastUserId) {
            // Delete the message so it looks like nobody said anything
            await message.delete().catch(() => {});
            
            // Send notification and delete after 3 seconds
            const reply = await message.channel.send({
                content: `<@${message.author.id}>, you can't count twice in a row!`
            }).catch(() => {});
                
            if (reply) {
                setTimeout(() => {
                    reply.delete().catch(() => {});
                }, 3000);
            }
            
            return;
        }
        
        // Update last three users
        let newLastThree = [...countData.lastThreeUsers];
        newLastThree.push(message.author.id);
        if (newLastThree.length > 3) {
            newLastThree.shift();
        }

        // Update count and user data
        const newCount = countData.currentCount + 1;
        await CountModel.findOneAndUpdate(
            { guildId: message.guild.id },
            {
                currentCount: newCount,
                lastUserId: message.author.id,
                lastThreeUsers: newLastThree,
                highScore: Math.max(newCount, countData.highScore || 0)
            }
        );

        // React to confirm valid count
        await message.react('✅').catch(() => {});

        // Optional: Add milestone messages with auto-delete
        if (newCount % 100 === 0) {
            const milestone = await message.reply(`🎉 Milestone reached: ${newCount}!`)
                .catch(() => {});
                
            if (milestone) {
                setTimeout(() => {
                    milestone.delete().catch(() => {});
                }, 5000); // Keep milestone messages a bit longer (5 seconds)
            }
        }

    } catch (error) {
        // Only log actual errors, not debug info
        console.error('Error in counting game:', error.message);
    }
};