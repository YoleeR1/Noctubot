Discord = require('discord.js');

module.exports = async (client, interaction, args) => {
    const message = interaction.options.getString('message');

    client.succNormal({
        text: `Message has been sent successfully!`,
        type: 'ephemeraledit'
    }, interaction);

    if (message == "information") {
        client.simpleEmbed({
            image: `https://cdn.discordapp.com/attachments/843487478881976381/874742689017520128/Bot_banner_information.jpg`
        }, interaction.channel).then(() => {
            client.embed({
                title: `ℹ️・Information`,
                thumbnail: client.user.avatarURL({ size: 1024 }),
                desc: `**Welcome to Nocturnals!**
We're thrilled to have you here! This is your space to hang out, meet new people, enjoy fun games, and join in exciting seasonal events. Our goal is to create a comfortable and inclusive environment where everyone can feel at home. So, make yourself comfortable and have a great time!

**❓ What do we offer?**
Meet incredible people from all over the world and make lasting friendships!
Join our fun games and events — check out announcements and get involved in the action at <#1216812748701438044>!
Customize your experience by choosing your own roles and profile with our unique, custom roles in <#1216793657680855130>

**💡 Have an Idea?**
Got a suggestion to improve our community? Head over to <#1327742619278643260> and use the /suggestions commands to share your ideas! The community can vote on them, and the most popular ones will be reviewed by our team.

**🎫 Need help?**
If you ever run into any issues or have questions, simply create a ticket <#1217122140248080535>. Our team is here to assist you and will respond as quickly as possible to help resolve any problems.

**🧠 Feeling down?**
You’re not alone. We’ve got an incredible support team ready to help. If you’re feeling low, need someone to talk to, or want advice, our Mental Health section is here for you. You can share your feelings or vent in <#1275976557172621403>. And don’t worry – it’s all discreet! We use our Confessions channel to ensure your privacy, so you can express yourself freely and safely, without anyone knowing who you are.`
            }, interaction.channel)
        })
    }

    if (message == "rules") {
        client.simpleEmbed({
            image: `https://cdn.discordapp.com/attachments/843487478881976381/874742702393131038/Bot_banner_rules.jpg`
        }, interaction.channel).then(() => {
            client.embed({
                title: `📜・Server Rules`,
                thumbnail: client.user.avatarURL({ size: 1024 }),
                desc: `**Welcome to the server! Please follow these rules to ensure a safe and enjoyable community for everyone. Breaking the rules will result in consequences.**

**🤝 General Rules**
• **Respect Others**
🔹 Be kind and respectful to all members. Hate speech, bullying, or discrimination is not tolerated.

• **No Spamming**
🔹 Avoid sending repetitive messages, emojis, or links that disrupt the chat.

• **Follow Channel Topics**
🔹 Keep your messages relevant to the channel's purpose. Check the channel description if you're unsure!

• **No NSFW or Illegal Content**
🔹 Sharing explicit, violent, or illegal material is strictly prohibited.

• **Follow Discord's Guidelines**
🔹 Ensure you comply with Discord's Terms of Service and Community Guidelines.

• **No Self-Promotion Without Permission**
🔹 Advertising and posting social links requires staff approval.

• **Use Appropriate Usernames**
🔹 Offensive or misleading nicknames/usernames will be changed or removed by staff.

• **Respect Privacy**
🔹 Do not share personal information about yourself or others.

• **No Toxic Behavior**
🔹 Trolling, instigating drama, or behaving disrespectfully will lead to warnings or bans.

**📝 Additional Rules**
• **No Leaking Staff Messages**
🔹 Private messages, decisions, or communications from the staff team must not be shared or leaked under any circumstances.

• **Age Restriction (16+)**
🔹 This server is restricted to users aged 16 and above. Access is not permitted for individuals under this age.
🔹 If a moderator suspects that a member is under 16, the member must provide proof of their age to avoid being banned. Failure to provide proof or any attempt to deceive moderators will result in removal from the server.

**🎧 Voice Channel Rules**
🔹 Be respectful to others when using voice channels.
🔹 Use "Push-to-Talk" if requested.
🔹 Avoid screaming, playing loud music, or disrupting conversations.

**📢 Bot and Role Rules**
🔹 Use bots as intended—don't spam commands.
🔹 Do not misuse custom roles or permissions.`
            }, interaction.channel)
        })
    }

    if (message == "valrules") {
        client.simpleEmbed({
            image: `https://cdn.discordapp.com/attachments/843487478881976381/874742702393131038/Bot_banner_rules.jpg`
        }, interaction.channel).then(() => {
            client.embed({
                title: `🎮・Custom Game Rules`,
                thumbnail: client.user.avatarURL({ size: 1024 }),
                desc: `**Welcome to our custom games! Please follow these rules to ensure a fair and fun experience for everyone.**

**🚫 No Toxic Behavior**
🔹 Trolling, instigating drama, or behaving    disrespectfully will result in warnings or    bans.

**📏 Stick to the Rules**
🔹 Always follow the specific game mode's    rules (e.g., knife-only 🔪, abilities-only ✨).
🔹 Breaking game mode rules will lead to    warnings.

**🤫 No Leaking Game Details**
🔹 Strategies, private discussions, or team    plans must NOT be shared with opponents    under any circumstances.

**⚠️ Warning & Ban System**
🔹 Two warnings will result in a ban.
🔹 Warnings/bans may be reset only if    admins unanimously agree on an exception.

**🎧 Voice Channel Etiquette**
🔹 Be respectful when communicating.
🔹 Avoid shouting, loud noises, or    disrupting conversations.
🔹 Use "Push-to-Talk" if requested by the    team or admin.

**🏆 Additional Guidelines**
🔹 Team Balance: Teams will be shuffled for    fairness if necessary.
🔹 Fun First: These games are about    enjoyment—don't take things too seriously!`
            }, interaction.channel)
        })
    }

    if (message == "applications") {
        client.simpleEmbed({
            image: `https://cdn.discordapp.com/attachments/843487478881976381/874742737415581786/Bot_banner_applications.jpg`
        }, interaction.channel).then(() => {
            client.embed({
                title: `💼・Applications`,
                thumbnail: client.user.avatarURL({ size: 1024 }),
                desc: `_____ \n\nWhat could be more fun than working at the best bot/server? We regularly have spots for new positions that you can apply for \n\nBut... what can you expect?`,
                fields: [
                    {
                        name: `👥┆A very nice team`,
                        value: `In the Bot team there is always a pleasant atmosphere and everyone is treated equally!`,
                    },
                    {
                        name: `🥳┆Access to the beta program`,
                        value: `Get access to unreleased Bot features with your own server! You are a real Bot tester!`,
                    },
                    {
                        name: `📛┆A nice rank and badge`,
                        value: `You will get a nice rank in the server and a team badge in our userinfo command. Everyone can see that you contribute to the team`,
                    },
                    {
                        name: `📖┆Learn and grow`,
                        value: `We understand that you don't always understand everything right away! At Bot, we give you the opportunity to learn new things and get better at the position. You can also grow into the management team in the future!`,
                    },
                    {
                        name: `📘┆What does everything mean?`,
                        value: `**Moderator** \nYou keep yourself busy with the server that everything is and remains fun for everyone! Chat with us and keep the overview \n\n**Marketing** \nWe also want to grow and we do that with a great marketing team! You know better than anyone how to make a server grow well \n\n**Organization** \nYou will ensure an even nicer atmosphere in the server! Together with a team you work on new and fun events to make the server even more fun!`,
                    },
                    {
                        name: `📃┆Apply?`,
                        value: `Create a ticket to receive your application!`,
                    }
                ]
            }, interaction.channel)
        })
    }

    if (message == "boosterperks") {
        client.simpleEmbed({
            image: `https://media.discordapp.net/attachments/843487478881976381/881396544195149874/Bot_banner_boosters.jpg`
        }, interaction.channel).then(() => {
            client.embed({
                title: `💎・Booster Perks`,
                thumbnail: client.user.avatarURL({ size: 1024 }),
                desc: `_____ \n\nMore options in the server? Become a real Bot Booster and get nice benefits for a nice experience. But what do you actually get?`,
                fields: [
                    {
                        name: `😛┆Use external stickers`,
                        value: `Use stickers from other servers in our server`,
                    },
                    {
                        name: `🔊┆Send TTS messages`,
                        value: `Send messages that have a sound attached`,
                    },
                    {
                        name: `🤔┆Access to the hidden lounge`,
                        value: `Get access to a private lounge and chat with other boosters!`,
                    },
                    {
                        name: `📛┆Change your nickname`,
                        value: `Change your name in the server. This is how you stand out in the server`,
                    },
                    {
                        name: `💭┆Create public/private threads`,
                        value: `Create a thread in our text channels`,
                    },
                    {
                        name: `🎉┆Private giveaways`,
                        value: `Get access to fun exclusive giveaways`,
                    },
                    {
                        name: `📂┆Send files in any channel`,
                        value: `Send files in all channels where you can talk`,
                    },
                    {
                        name: `📊┆Get access to a special promotional channel`,
                        value: `Get the opportunity to promote your own server in a special channel`,
                    },
                    {
                        name: `😜┆Custom role of your choice`,
                        value: `Create your own role that you can set yourself`,
                    },
                    {
                        name: `💎┆Get the booster role + badge`,
                        value: `Stand out with a nice booster role and a booster badge!`,
                    },
                    {
                        name: `💻┆Access to new bèta updates in Bot`,
                        value: `We'll give your server access to updates that aren't out yet! How nice is that?`,
                    }
                ]
            }, interaction.channel)
        })
    }

    if (message == "links") {
        client.simpleEmbed({
            image: `https://media.discordapp.net/attachments/843487478881976381/881396544195149874/Bot_banner_boosters.jpg`
        }, interaction.channel).then(() => {
            client.embed({
                title: `🔗・Links`,
                thumbnail: client.user.avatarURL({ size: 1024 }),
                desc: `_____ \n\nSee all the links from Bot Network!`,
                fields: [
                    {
                        name: `▬▬│Servers│▬▬`,
                        value: ``,
                    }
                ]
            }, interaction.channel)
        })
    }

    if (message == "rewards") {
        client.embed({
            title: `😜・Role Rewards`,
            thumbnail: client.user.avatarURL({ size: 1024 }),
            desc: `_____ \n\nDo you want some extras in the server? Or do you want to stand out more in the server? Look below for the rewards`,
            fields: [
                {
                    name: `🏆┆Levels`,
                    value: `- Level 5   | <@&833307296699908097>\n- Level 10  | <@&833307450437664838>\n- Level 15  | <@&833307452279226379>\n- Level 30 | <@&915290300757458964>\n- Level 40 | <@&915290324480430080>`,
                },
                {
                    name: `🥳┆Special`,
                    value: `- 1 server vote | <@&833959913742794772>\n- 1 boost | <@&744208324022501447>\n- 1 donate | <@&849554599371210793>`,
                },
                {
                    name: `💰┆Economy`,
                    value: `- $10.000 | <@&890720270086733854>\n- $15.000 | <@&833936202725720084>\n- $20.000 | <@&833936185167839232> \n- $25.000 | <@&928236333309255711> \n- $30.000 | <@&928235747100733450>`,
                }
            ]
        }, interaction.channel)
    }

    if (message == "ourbots") {
        client.simpleEmbed({
            image: `https://cdn.discordapp.com/attachments/843487478881976381/874742741224022016/Bot_banner_bot_info.jpg`
        }, interaction.channel).then(() => {
            client.embed({
                title: `🤖・Our bots`,
                thumbnail: client.user.avatarURL({ size: 1024 }),
                desc: `_____ \n\nOutside of a community we also maintain 2 public bots. These bots are all made to make your server better!`,
                fields: [
                    {
                        name: `📘┆What is Bot?`,
                        value: `Bot is a bot with which you can run your entire server! With no less than 400+ commands, we have a large bot with many options to improve your server! You know what else is beautiful? All of this is **FREE** to use!`,
                    },
                    {
                        name: `🎶┆What is Bot 2?`,
                        value: `Bot 2 was created for additional music. This way you never get in each other's way when someone is already listening to music. Furthermore, this bot contains a soundboard and a radio system`,
                    },
                    {
                        name: `📨┆How do I invite the bots?`,
                        value: `You can invite the bots by doing \`/invite\` or by clicking on the links below \n\n**Bot** - [Invite here](${client.config.discord.botInvite})`,
                    },
                    {
                        name: `🎫┆How do I get help when needed?`,
                        value: `You can make a ticket in <#820308164322656327>! We are happy to help you with your questions here and offer support in your server!`,
                    }
                ]
            }, interaction.channel)
        })
    }
}
