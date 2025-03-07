const discord = require('discord.js');
module.exports = async (client, messageDeleted) => {
    try {
        if (!messageDeleted) return;
        if (messageDeleted.author.bot) return;

        var content = messageDeleted.content;
        if (!content) content = "No text to be found";
        if (messageDeleted.attachments.size > 0) content = messageDeleted.attachments.first()?.url;

        const logsChannel = await client.getLogs(messageDeleted.guild.id);
        if (!logsChannel) return;

        // Improved deletion author detection
        let deletedBy = '- Unknown (Automatic/System Delete)';

        try {
            const fetchedLogs = await messageDeleted.guild.fetchAuditLogs({
                limit: 5, // Increase limit to catch recent deletes
                type: discord.AuditLogEvent.MessageDelete
            });

            const deletionLogs = fetchedLogs.entries.filter(
                entry => entry.target.id === messageDeleted.author.id &&
                         entry.createdTimestamp > Date.now() - 5000 // Within last 5 seconds
            );

            if (deletionLogs.size > 0) {
                const deletionLog = deletionLogs.first();
                if (deletionLog && deletionLog.executor) {
                    deletedBy = `- ${deletionLog.executor} (${deletionLog.executor.tag})`;
                }
            }
        } catch (logError) {
            console.error('Error fetching audit logs:', logError);
        }

        client.embed({
            title: `💬・Message deleted`,
            desc: `A message has been deleted`,
            fields: [
                {
                    name: `> Original Author`,
                    value: `- ${messageDeleted.author} (${messageDeleted.author.tag})`
                },
                {
                    name: `> Deleted By`,
                    value: deletedBy
                },
                {
                    name: `> Date`,
                    value: `- ${messageDeleted.createdAt}`
                },
                {
                    name: `> Channel`,
                    value: `- ${messageDeleted.channel} (${messageDeleted.channel.name})`
                },
                {
                    name: `> Message`,
                    value: `\`\`\`${content.replace(/`/g, "'")}\`\`\``
                },
                {
                    name: `> Timestamp`,
                    value: `- <t:${Math.floor(messageDeleted.createdTimestamp / 1000)}:R>`
                }
            ]
        }, logsChannel).catch(() => { })
    }
    catch (error) {
        console.error('Error in message delete logging:', error);
    }
};
