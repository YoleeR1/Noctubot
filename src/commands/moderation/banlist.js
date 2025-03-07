const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = async (client, interaction) => {
    const perms = await client.checkPerms({
        flags: [PermissionsBitField.Flags.BanMembers],
        perms: [PermissionsBitField.Flags.BanMembers]
    }, interaction);

    if (perms == false) return;

    try {
        const bannedUsers = await interaction.guild.bans.fetch();

        if (bannedUsers.size === 0) {
            return client.errNormal({
                error: 'This server has no bans',
                type: 'editreply'
            }, interaction);
        }

        
        const formattedBanList = bannedUsers.map(ban => {
            const username = ban.user.username;
            const userId = ban.user.id;
            
            const reason = ban.reason 
                ? (ban.reason.length > 300 ? ban.reason.substring(0, 300) + '...' : ban.reason)
                : 'No reason provided';
            
            return `\`${username}\` (${userId})\n┗ Reason: ${reason}\n`;
        });

        
        const chunks = [];
        for (let i = 0; i < formattedBanList.length; i += 10) {
            chunks.push(formattedBanList.slice(i, i + 10));
        }

        
        const embeds = chunks.map((chunk, index) => {
            return new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle(`🔨 Ban List - ${interaction.guild.name}`)
                .setDescription(chunk.join('\n'))
                .setFooter({
                    text: `Page ${index + 1}/${chunks.length} • Total Bans: ${bannedUsers.size}`
                })
                .setTimestamp();
        });

       
        if (embeds.length === 1) {
            await interaction.editReply({ embeds: [embeds[0]] });
            return;
        }

        
        if (client.createLeaderboard) {
            await client.createLeaderboard(
                `🔨 Ban List - ${interaction.guild.name}`,
                formattedBanList,
                interaction
            );
        } else {
           
            let currentPage = 0;
            const reply = await interaction.editReply({
                embeds: [embeds[currentPage]],
                components: [
                    {
                        type: 1,
                        components: [
                            {
                                type: 2,
                                style: 1,
                                label: '⬅️ Previous',
                                custom_id: 'prev_page',
                                disabled: true
                            },
                            {
                                type: 2,
                                style: 1,
                                label: 'Next ➡️',
                                custom_id: 'next_page',
                                disabled: embeds.length === 1
                            }
                        ]
                    }
                ]
            });

            
            const collector = reply.createMessageComponentCollector({
                time: 60000
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'prev_page' && currentPage > 0) {
                    currentPage--;
                } else if (i.customId === 'next_page' && currentPage < embeds.length - 1) {
                    currentPage++;
                }

                await i.update({
                    embeds: [embeds[currentPage]],
                    components: [
                        {
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    style: 1,
                                    label: '⬅️ Previous',
                                    custom_id: 'prev_page',
                                    disabled: currentPage === 0
                                },
                                {
                                    type: 2,
                                    style: 1,
                                    label: 'Next ➡️',
                                    custom_id: 'next_page',
                                    disabled: currentPage === embeds.length - 1
                                }
                            ]
                        }
                    ]
                });
            });

            collector.on('end', () => {
                reply.edit({
                    components: []
                }).catch(() => {});
            });
        }

    } catch (error) {
        console.error('Error fetching banlist:', error);
        return client.errNormal({
            error: 'An error occurred while fetching the banlist',
            type: 'editreply'
        }, interaction);
    }
};