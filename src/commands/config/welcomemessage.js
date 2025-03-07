const Discord = require('discord.js');
const inviteMessages = require("../../database/models/inviteMessages");

module.exports = async (client, interaction, args) => {
    const perms = await client.checkUserPerms({
        flags: [Discord.PermissionsBitField.Flags.ManageMessages],
        perms: [Discord.PermissionsBitField.Flags.ManageMessages]
    }, interaction);
    
    if (perms == false) return;

    const message = interaction.options.getString('message');
    
    if (message.toUpperCase() == "HELP") {
        return client.embed({
            title: `ℹ️・Welcome Message Options`,
            desc: `Join message options: \n
            \`{user:username}\` - User's username
            \`{user:discriminator}\` - User's discriminator
            \`{user:tag}\` - User's tag
            \`{user:mention}\` - Mention a user
            \`{user:avatar}\` - User's avatar URL
            \`{guild:name}\` - Server name
            \`{guild:members}\` - Server members count
            \`{timestamp}\` - Current time (shows in user's timezone)
            \`\\n\` - New line (use this to create line breaks)
            \`[image]\` - Add the welcome image`,
            color: 0xFF69B4,
            type: 'editreply'
        }, interaction);
    }

    if (message.toUpperCase() == "DEFAULT") {
        inviteMessages.findOne({ Guild: interaction.guild.id }, async (err, data) => {
            if (data) {
                data.inviteJoin = null;
                data.save();
                client.succNormal({
                    text: `Welcome message deleted!`,
                    type: 'editreply'
                }, interaction);
            }
        });
        return;
    }

    inviteMessages.findOne({ Guild: interaction.guild.id }, async (err, data) => {
        if (data) {
            data.inviteJoin = message;
            data.save();
        } else {
            new inviteMessages({
                Guild: interaction.guild.id,
                inviteJoin: message
            }).save();
        }

        // Get current Unix timestamp for the preview
        const timestamp = Math.floor(Date.now() / 1000);
        
        // Create preview message
        const previewMessage = message
            .replace('{timestamp}', `<t:${timestamp}:F>`)  // Using Discord's timestamp format
            .replace('{user:username}', 'ExampleUser')
            .replace('{guild:members}', interaction.guild.memberCount)
            .replace(/\\n/g, '\n')
            .replace(/\[image\]/g, '') // Remove image placeholder for preview

        const embed = new Discord.EmbedBuilder()
            .setColor(0xFF69B4)
            .setDescription(previewMessage)
            .setImage('https://user-content.mimu.bot/1229860957136752792-1229925463674322985-image.png');

        await interaction.editReply({
            content: `<@${interaction.user.id}>`,
            embeds: [embed]
        });
    });
};
