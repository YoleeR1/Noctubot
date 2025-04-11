const discord = require('discord.js');

const leaveSchema = require("../../database/models/leaveChannels");
const messages = require("../../database/models/inviteMessages");
const invitedBy = require("../../database/models/inviteBy");
const invites = require("../../database/models/invites");

module.exports = async (client, member) => {
    const messageData = await messages.findOne({ Guild: member.guild.id });
    const inviteByData = await invitedBy.findOne({ Guild: member.guild.id, User: member.id });
    const channelData = await leaveSchema.findOne({ Guild: member.guild.id });

    if (inviteByData) {
        const inviteData = await invites.findOne({ Guild: member.guild.id, User: inviteByData.inviteUser });

        if (inviteData) {
            inviteData.Invites -= 1;
            inviteData.Left += 1;
            inviteData.save();
        }

        if (channelData) {
            if (messageData && messageData.inviteLeave) {
                // Instead of manually replacing tokens, use parseCustomMessage with context
                const embeds = client.parseCustomMessage(messageData.inviteLeave, {
                    member: member,
                    guild: member.guild,
                    client: client
                });
                const channel = member.guild.channels.cache.get(channelData.Channel);
                await channel.send({ embeds: embeds }).catch(() => {});
            } else {
                client.users.fetch(inviteData.User).then(async (user) => {
                    const channel = member.guild.channels.cache.get(channelData.Channel);
                    await client.embed({
                        title: `👋・Bye`,
                        desc: `**${member.user.tag}** was invited by ${user.tag}`
                    }, channel).catch(() => {});
                }).catch(async () => {
                    if (channelData) {
                        const channel = member.guild.channels.cache.get(channelData.Channel);
                        await client.embed({
                            title: `👋・Bye`,
                            desc: `**${member.user.tag}** has left us`
                        }, channel).catch(() => {});
                    }
                });
            }
        }
    }
    else {
        if (channelData) {

            const channel = member.guild.channels.cache.get(channelData.Channel)

            await client.embed({
                title: `👋・Bye`,
                desc: `**${member.user.tag}** has left us`
            }, channel).catch(() => { })
        }
    }
};