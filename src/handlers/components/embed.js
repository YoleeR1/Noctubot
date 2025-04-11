const Discord = require('discord.js');

/** 
 * Easy to send errors because im lazy to do the same things :p
 * @param {String} text - Message which is need to send
 * @param {TextChannel} channel - A Channel to send error
 */

const Schema = require("../../database/models/functions");

module.exports = (client) => {
    client.templateEmbed = function () {
        return new Discord.EmbedBuilder()
            .setAuthor({
                name: client.user.username,
                iconURL: client.user.avatarURL({ size: 1024 })
            })
            // Modified default embed color to Discord's default (0x2F3136)
            .setColor(0x2F3136)
            .setFooter({
                text: client.config.discord.footer,
                iconURL: client.user.avatarURL({ size: 1024 })
            })
            .setTimestamp();
    }

    //----------------------------------------------------------------//
    //                        ERROR MESSAGES                          //
    //----------------------------------------------------------------//

    // Normal error 
    client.errNormal = async function ({
        embed: embed = client.templateEmbed(),
        error: error,
        type: type,
        content: content,
        components: components
    }, interaction) {
        embed.setTitle(`${client.emotes.normal.error}・Error!`)
        embed.setDescription(`Something went wrong!`)
        embed.addFields( 
            { name: "💬┆Error comment", value: `\`\`\`${error}\`\`\``},
        )
        embed.setColor(client.config.colors.error)

        return client.sendEmbed({
            embeds: [embed],
            content: content,
            components: components,
            type: type
        }, interaction)
    }

    // Missing args
    client.errUsage = async function ({
        embed: embed = client.templateEmbed(),
        usage: usage,
        type: type,
        content: content,
        components: components
    }, interaction) {
        embed.setTitle(`${client.emotes.normal.error}・Error!`)
        embed.setDescription(`You did not provide the correct arguments`)
        embed.addFields(
            { name: "💬┆Required arguments", value: `\`\`\`${usage}\`\`\``},    
        )
        embed.setColor(client.config.colors.error)

        return client.sendEmbed({
            embeds: [embed],
            content: content,
            components: components,
            type: type
        }, interaction)
    }

    // Missing perms

    client.errMissingPerms = async function ({
        embed: embed = client.templateEmbed(),
        perms: perms,
        type: type,
        content: content,
        components: components
    }, interaction) {
        embed.setTitle(`${client.emotes.normal.error}・Error!`)
        embed.setDescription(`You don't have the right permissions`)
        embed.addFields(
            { name: "🔑┆Required Permission", value: `\`\`\`${perms}\`\`\``},
        )
        embed.setColor(client.config.colors.error)

        return client.sendEmbed({
            embeds: [embed],
            content: content,
            components: components,
            type: type
        }, interaction)
    }

    // No bot perms

    client.errNoPerms = async function ({
        embed: embed = client.templateEmbed(),
        perms: perms,
        type: type,
        content: content,
        components: components
    }, interaction) {
        embed.setTitle(`${client.emotes.normal.error}・Error!`)
        embed.setDescription(`I don't have the right permissions`)
        embed.addFields(
            { name: "🔑┆Required Permission", value: `\`\`\`${perms}\`\`\``},
        )
        embed.setColor(client.config.colors.error)

        return client.sendEmbed({
            embeds: [embed],
            content: content,
            components: components,
            type: type
        }, interaction)
    }

    // Wait error

    client.errWait = async function ({
        embed: embed = client.templateEmbed(),
        time: time,
        type: type,
        content: content,
        components: components
    }, interaction) {
        embed.setTitle(`${client.emotes.normal.error}・Error!`)
        embed.setDescription(`You've already done this once`)
        embed.addFields(
            { name: "⏰┆Try again on", value: `<t:${time}:f>`},
        )
        embed.setColor(client.config.colors.error)

        return client.sendEmbed({
            embeds: [embed],
            content: content,
            components: components,
            type: type
        }, interaction)
    }

    //----------------------------------------------------------------//
    //                        SUCCES MESSAGES                         //
    //----------------------------------------------------------------//

    // Normal succes
    client.succNormal = async function ({
        embed: embed = client.templateEmbed(),
        text: text,
        fields: fields,
        type: type,
        content: content,
        components: components
    }, interaction) {
        embed.setTitle(`${client.emotes.normal.check}・Success!`)
        embed.setDescription(`${text}`)
        embed.setColor(client.config.colors.succes)

        if (fields) embed.addFields(fields);

        return client.sendEmbed({
            embeds: [embed],
            content: content,
            components: components,
            type: type
        }, interaction)
    }

    //----------------------------------------------------------------//
    //                        BASIC MESSAGES                          //
    //----------------------------------------------------------------//

    // Default
    client.embed = async function ({
        embed: embed = client.templateEmbed(),
        title: title,
        desc: desc,
        color: color,
        image: image,
        author: author,
        url: url,
        footer: footer,
        thumbnail: thumbnail,
        fields: fields,
        content: content,
        components: components,
        type: type
    }, interaction) {
        if (interaction.guild == undefined) interaction.guild = { id: "0" };
        const functiondata = await Schema.findOne({ Guild: interaction.guild.id })

        if (title) embed.setTitle(title);
        if (desc && desc.length >= 2048) embed.setDescription(desc.substr(0, 2044) + "...");
        else if (desc) embed.setDescription(desc);
        if (image) embed.setImage(image);
        if (thumbnail) embed.setThumbnail(thumbnail);
        if (fields) embed.addFields(fields);
        if (author) embed.setAuthor(author);
        if (url) embed.setURL(url);
        if (footer) embed.setFooter({ text: footer });
        if (color) embed.setColor(color);
        if (functiondata && functiondata.Color && !color) embed.setColor(functiondata.Color)
        return client.sendEmbed({
            embeds: [embed],
            content: content,
            components: components,
            type: type
        }, interaction)
    }

    client.simpleEmbed = async function ({
        title: title,
        desc: desc,
        color: color,
        image: image,
        author: author,
        thumbnail: thumbnail,
        fields: fields,
        url: url,
        content: content,
        components: components,
        type: type
    }, interaction) {
        const functiondata = await Schema.findOne({ Guild: interaction.guild.id })

        let embed = new Discord.EmbedBuilder()
            .setColor(client.config.colors.normal)

        if (title) embed.setTitle(title);
        if (desc && desc.length >= 2048) embed.setDescription(desc.substr(0, 2044) + "...");
        else if (desc) embed.setDescription(desc);
        if (image) embed.setImage(image);
        if (thumbnail) embed.setThumbnail(thumbnail);
        if (fields) embed.addFields(fields);
        if (author) embed.setAuthor(author[0], author[1]);
        if (url) embed.setURL(url);
        if (color) embed.setColor(color);
        if (functiondata && functiondata.Color && !color) embed.setColor(functiondata.Color)

        return client.sendEmbed({
            embeds: [embed],
            content: content,
            components: components,
            type: type
        }, interaction)
    }

    client.sendEmbed = async function ({
        embeds: embeds,
        content: content,
        components: components,
        type: type
    }, interaction) {
        if (type && type.toLowerCase() == "edit") {
            return await interaction.edit({
                embeds: embeds,
                content: content,
                components: components,
                fetchReply: true
            }).catch(e => { });
        }
        else if (type && type.toLowerCase() == "editreply") {
            return await interaction.editReply({
                embeds: embeds,
                content: content,
                components: components,
                fetchReply: true
            }).catch(e => { });
        }
        else if (type && type.toLowerCase() == "reply") {
            return await interaction.reply({
                embeds: embeds,
                content: content,
                components: components,
                fetchReply: true
            }).catch(e => { });
        }
        else if (type && type.toLowerCase() == "update") {
            return await interaction.update({
                embeds: embeds,
                content: content,
                components: components,
                fetchReply: true
            }).catch(e => { });
        }
        else if (type && type.toLowerCase() == "ephemeraledit") {
            return await interaction.editReply({
                embeds: embeds,
                content: content,
                components: components,
                fetchReply: true,
                ephemeral: true
            }).catch(e => { });
        }
        else if (type && type.toLowerCase() == "ephemeral") {
            return await interaction.reply({
                embeds: embeds,
                content: content,
                components: components,
                fetchReply: true,
                ephemeral: true
            }).catch(e => { });
        }
        else {
            return await interaction.send({
                embeds: embeds,
                content: content,
                components: components,
                fetchReply: true
            }).catch(e => { });
        }
    }

    // Add custom message parsing for welcome/leave messages using explicit tokens.
    client.parseCustomMessage = function(raw, context) {
        // Modified default fallback color to Discord's default (0x2F3136)
        let color = (context && context.client && context.client.config.colors.normal) || 0x2F3136;
        const colorMatch = raw.match(/\{color:(#[0-9A-Fa-f]{6})\}/);
        if(colorMatch) {
            color = colorMatch[1];
            raw = raw.replace(colorMatch[0], '');
        }
        // Flag for user avatar thumbnail
        let useAvatar = false;
        if(raw.includes("{user:avatar}")) {
            useAvatar = true;
            raw = raw.replace(/{user:avatar}/g, "");
        }
        // Replace common placeholders
        if(context && context.member) {
            raw = raw.replace(/{user:username}/g, context.member.user.username)
                     .replace(/{user:tag}/g, context.member.user.tag)
                     .replace(/{user:mention}/g, `<@${context.member.id}>`);
        }
        if(context && context.guild) {
            raw = raw.replace(/{guild:name}/g, context.guild.name)
                     .replace(/{guild:members}/g, context.guild.memberCount);
        }
        raw = raw.replace(/{timestamp}/g, `<t:${Math.floor(Date.now()/1000)}:F>`);
        // Replace literal "\n" with actual newline
        raw = raw.replace(/\\n/g, "\n");
        // Split into parts using [split] if present.
        const parts = raw.split("[split]");
        const embeds = [];
        parts.forEach(part => {
            let embed = new Discord.EmbedBuilder().setColor(color);
            // Extract tokens
            const authorMatch = part.match(/\{author:([^}]*)\}/i);
            if(authorMatch) {
                embed.setAuthor({ name: authorMatch[1].trim() });
                part = part.replace(authorMatch[0], '');
            }
            const imageMatch = part.match(/\{image:([^}]*)\}/i);
            if(imageMatch) {
                embed.setImage(imageMatch[1].trim());
                part = part.replace(imageMatch[0], '');
            }
            const footerMatch = part.match(/\{footer:([^}]*)\}/i);
            if(footerMatch) {
                embed.setFooter({ text: footerMatch[1].trim() });
                part = part.replace(footerMatch[0], '');
            }
            const fieldsMatch = part.match(/\{fields:([^}]*)\}/i);
            if(fieldsMatch) {
                let fieldsRaw = fieldsMatch[1].trim();
                let fieldsArr = fieldsRaw.split(";").filter(f => f.includes("::")).map(f => {
                    let [name, value] = f.split("::");
                    return { name: name.trim(), value: value.trim(), inline: false };
                });
                if(fieldsArr.length) embed.addFields(fieldsArr);
                part = part.replace(fieldsMatch[0], '');
            }
            // Whatever remains becomes the description (body).
            if(part.trim()) {
                let currentDesc = embed.data.description || "";
                embed.setDescription(currentDesc + part.trim());
            }
            embeds.push(embed);
        });
        // If {user:avatar} was found and context.member exists then set thumbnail on first embed.
        if(useAvatar && context && context.member && context.member.user &&
           typeof context.member.user.displayAvatarURL === "function" && embeds.length > 0) {
            embeds[0].setThumbnail(context.member.user.displayAvatarURL({ dynamic: true, size: 1024 }));
        }
        return embeds;
    };
}

