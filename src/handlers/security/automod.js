const Discord = require('discord.js');
const AutomodSchema = require('../../database/models/automod');

// Cache for guild automod settings to reduce database calls
const automodCache = new Map();
const CACHE_TIMEOUT = 60 * 60 * 1000; // 1 hour

/**
 * Handles automod for a Discord message
 * @param {Discord.Client} client - Discord client
 * @param {Discord.Message} message - Message to check
 * @param {boolean} isEdit - Whether this is an edited message
 */
async function handleMessage(client, message, isEdit = false) {
    // Skip DMs and bot messages
    if (message.channel.type === Discord.ChannelType.DM || message.author.bot) return;

    // Get guild automod settings (from cache if available)
    const automodSettings = await getAutomodSettings(message.guild.id);
    if (!automodSettings || !automodSettings.enabled) return;
    
    // Check if the user is exempt by admin permissions
    if (message.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) return;
    
    // Check for automod rule violations
    for (const rule of automodSettings.rules) {
        if (!rule.enabled) continue;
        
        // Check exemptions
        if (isExempt(message, rule)) continue;
        
        // Check if message violates this rule
        const violation = await checkViolation(message, rule);
        if (violation) {
            // Handle the violation
            await handleViolation(client, message, rule, automodSettings, violation);
            // We only process the first matching rule to avoid multiple actions for one message
            break;
        }
    }
}

/**
 * Get automod settings for a guild (with caching)
 * @param {string} guildId - The guild ID
 */
async function getAutomodSettings(guildId) {
    // Check cache first
    if (automodCache.has(guildId)) {
        const cachedData = automodCache.get(guildId);
        if (Date.now() - cachedData.timestamp < CACHE_TIMEOUT) {
            return cachedData.data;
        }
    }
    
    // Fetch from database
    try {
        const settings = await AutomodSchema.findOne({ Guild: guildId });
        
        // Update cache
        if (settings) {
            automodCache.set(guildId, {
                data: settings,
                timestamp: Date.now()
            });
        }
        
        return settings;
    } catch (error) {
        console.error(`Error fetching automod settings for guild ${guildId}:`, error);
        return null;
    }
}

/**
 * Check if message is exempt from the rule
 * @param {Discord.Message} message - The message to check
 * @param {Object} rule - The rule configuration
 */
function isExempt(message, rule) {
    // Check channel exemptions
    if (rule.exemptChannels && rule.exemptChannels.includes(message.channel.id)) {
        return true;
    }
    
    // Check user exemptions
    if (rule.exemptUsers && rule.exemptUsers.includes(message.author.id)) {
        return true;
    }
    
    // Check role exemptions
    if (rule.exemptRoles && rule.exemptRoles.length > 0) {
        for (const roleId of rule.exemptRoles) {
            if (message.member.roles.cache.has(roleId)) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Check if a message violates a rule
 * @param {Discord.Message} message - The message to check
 * @param {Object} rule - The rule configuration
 */
async function checkViolation(message, rule) {
    const content = message.content.toLowerCase();
    const settings = rule.settings || {};
    
    switch (rule.type) {
        case 'spam':
            // This would normally require checking message history - simplified here
            // In a real implementation, this would track message timing and count
            return false; // Placeholder
            
        case 'invite':
            // Check for Discord invites
            const invitePattern = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[a-zA-Z0-9]+/i;
            return invitePattern.test(content) ? { reason: 'Discord invite detected' } : false;
            
        case 'links':
            // Check for links (excluding whitelisted ones)
            if (content.includes('http://') || content.includes('https://') || content.includes('www.')) {
                // Check whitelist
                if (settings.allowedLinks && settings.allowedLinks.length > 0) {
                    for (const allowedLink of settings.allowedLinks) {
                        if (content.includes(allowedLink)) {
                            return false;
                        }
                    }
                }
                return { reason: 'Unauthorized link detected' };
            }
            return false;
            
        case 'words':
            // Check for blacklisted words
            if (settings.words && settings.words.length > 0) {
                // Basic word check
                const words = content.split(/\s+/);
                for (const word of words) {
                    if (settings.words.includes(word)) {
                        return { reason: 'Blacklisted word detected', word };
                    }
                }
                
                // More advanced check for phrases and partial matches
                for (const blockedTerm of settings.words) {
                    if (content.includes(blockedTerm.toLowerCase())) {
                        return { reason: 'Blacklisted term detected', word: blockedTerm };
                    }
                }
            }
            
            // Check regex patterns
            if (settings.regexPatterns && settings.regexPatterns.length > 0) {
                for (const patternStr of settings.regexPatterns) {
                    try {
                        const pattern = new RegExp(patternStr, 'i');
                        if (pattern.test(content)) {
                            return { reason: 'Matched regex pattern', pattern: patternStr };
                        }
                    } catch (error) {
                        console.error(`Invalid regex pattern: ${patternStr}`, error);
                    }
                }
            }
            
            // Check display name if enabled
            if (settings.checkDisplayName && message.member.displayName) {
                const displayName = message.member.displayName.toLowerCase();
                for (const blockedTerm of settings.words) {
                    if (displayName.includes(blockedTerm.toLowerCase())) {
                        return { 
                            reason: 'Blacklisted term in display name', 
                            word: blockedTerm,
                            isDisplayName: true
                        };
                    }
                }
            }
            
            return false;
            
        case 'mentions':
            // Check mention count
            const mentionCount = message.mentions.users.size;
            const roleMentionCount = message.mentions.roles.size;
            
            if (settings.maxMentions && mentionCount > settings.maxMentions) {
                return { 
                    reason: 'Too many user mentions', 
                    count: mentionCount, 
                    limit: settings.maxMentions 
                };
            }
            
            if (settings.maxRoleMentions && roleMentionCount > settings.maxRoleMentions) {
                return { 
                    reason: 'Too many role mentions', 
                    count: roleMentionCount, 
                    limit: settings.maxRoleMentions 
                };
            }
            
            return false;
            
        case 'capitals':
            // Check for excessive capital letters
            if (content.length < (settings.minLength || 8)) return false;
            
            const capsCount = content.replace(/[^A-Z]/g, '').length;
            const capsPercentage = (capsCount / content.length) * 100;
            
            if (capsPercentage > (settings.capsPercentage || 70)) {
                return { 
                    reason: 'Excessive capital letters', 
                    percentage: capsPercentage 
                };
            }
            
            return false;
            
        case 'attachments':
            // Check for attachments
            if (message.attachments.size > 0) {
                // This could be expanded to check file types, sizes, etc.
                return { reason: 'Attachments not allowed' };
            }
            return false;
            
        case 'stickers':
            // Check for stickers
            if (message.stickers.size > 0) {
                return { reason: 'Stickers not allowed' };
            }
            return false;
            
        case 'custom':
            // Execute custom regex pattern if provided
            if (settings.customRegex) {
                try {
                    const pattern = new RegExp(settings.customRegex, 'i');
                    if (pattern.test(content)) {
                        return { reason: 'Matched custom pattern' };
                    }
                } catch (error) {
                    console.error(`Invalid custom regex: ${settings.customRegex}`, error);
                }
            }
            return false;
            
        default:
            return false;
    }
}

/**
 * Handle a rule violation
 * @param {Discord.Client} client - Discord client
 * @param {Discord.Message} message - The message that violated a rule
 * @param {Object} rule - The rule that was violated
 * @param {Object} settings - Guild automod settings
 * @param {Object} violation - Violation details
 */
async function handleViolation(client, message, rule, settings, violation) {
    // Get appropriate action based on user history
    const action = determineAction(message.author.id, rule, settings);
    
    // Execute the action
    try {
        switch (action.type) {
            case 'delete':
                await message.delete();
                break;
                
            case 'warn':
                // Delete message if configured
                try {
                    await message.delete();
                } catch (error) {
                    console.error('Error deleting message:', error);
                }
                
                // Send warning
                if (settings.warnUsers) {
                    const warningEmbed = new Discord.EmbedBuilder()
                        .setTitle(`${client.emotes?.normal?.error || '⚠️'}・Automod Warning`)
                        .setDescription(`${violation.reason}\n${action.reason}`)
                        .setColor(client.config?.colors?.error || 0xFF0000)
                        .setTimestamp();
                    
                    try {
                        const warningMsg = await message.channel.send({
                            content: `${message.author}`,
                            embeds: [warningEmbed]
                        });
                        
                        // Delete warning after timeout if configured
                        if (settings.deleteWarnings) {
                            setTimeout(() => {
                                warningMsg.delete().catch(() => {});
                            }, settings.warningTimeout || 5000);
                        }
                    } catch (error) {
                        console.error('Error sending warning:', error);
                    }
                }
                break;
                
            case 'timeout':
                // Timeout the user
                try {
                    await message.member.timeout(
                        action.duration || 60000,
                        action.reason || 'Automod violation'
                    );
                    
                    await message.delete();
                    
                    // Notify user
                    const timeoutEmbed = new Discord.EmbedBuilder()
                        .setTitle(`${client.emotes?.normal?.error || '⚠️'}・Automod Timeout`)
                        .setDescription(`You have been timed out: ${action.reason}`)
                        .setColor(client.config?.colors?.error || 0xFF0000)
                        .addFields({
                            name: 'Duration',
                            value: `${Math.floor((action.duration || 60000) / 60000)} minutes`
                        })
                        .setTimestamp();
                    
                    message.channel.send({
                        content: `${message.author}`,
                        embeds: [timeoutEmbed]
                    }).then(msg => {
                        if (settings.deleteWarnings) {
                            setTimeout(() => {
                                msg.delete().catch(() => {});
                            }, settings.warningTimeout || 5000);
                        }
                    });
                } catch (error) {
                    console.error('Error timing out user:', error);
                }
                break;
                
            case 'kick':
                try {
                    await message.delete();
                    await message.member.kick(action.reason || 'Automod violation');
                } catch (error) {
                    console.error('Error kicking user:', error);
                }
                break;
                
            case 'ban':
                try {
                    await message.delete();
                    await message.member.ban({
                        reason: action.reason || 'Automod violation',
                        deleteMessageSeconds: 86400 // Delete 1 day of messages
                    });
                } catch (error) {
                    console.error('Error banning user:', error);
                }
                break;
        }
        
        // Log the action if configured
        await logAction(client, message, rule, action, violation, settings);
        
    } catch (error) {
        console.error('Error handling automod violation:', error);
    }
}

/**
 * Determine which action to take based on user history
 * @param {string} userId - The user ID
 * @param {Object} rule - The rule that was violated
 * @param {Object} settings - Guild automod settings
 */
function determineAction(userId, rule, settings) {
    if (!rule.actions || rule.actions.length === 0) {
        // Default action if none configured
        return { type: 'delete', reason: 'Automod violation' };
    }
    
    // Get user's violation history
    const offenders = settings.recentOffenders || new Map();
    const userRecord = offenders.get(userId) || { violations: [], lastEscalation: 0 };
    
    // Check for escalation based on recent violations
    const now = Date.now();
    const recentViolations = userRecord.violations.filter(timestamp => 
        now - timestamp < (rule.actions[0].escalationTimeout || 3600000)
    ).length;
    
    // Determine action index based on recent violations (capped by available actions)
    const actionIndex = Math.min(recentViolations, rule.actions.length - 1);
    
    // Update user record
    userRecord.violations.push(now);
    userRecord.lastEscalation = now;
    offenders.set(userId, userRecord);
    
    // Save updated records (async)
    settings.recentOffenders = offenders;
    settings.save().catch(err => console.error('Error saving offender record:', err));
    
    return rule.actions[actionIndex];
}

/**
 * Log an automod action to the configured log channel
 * @param {Discord.Client} client - Discord client
 * @param {Discord.Message} message - The message that violated a rule
 * @param {Object} rule - The rule that was violated
 * @param {Object} action - The action taken
 * @param {Object} violation - Violation details
 * @param {Object} settings - Guild automod settings
 */
async function logAction(client, message, rule, action, violation, settings) {
    // Skip if no log channel configured
    if (!settings.logChannel) return;
    
    try {
        const logChannel = await client.channels.fetch(settings.logChannel);
        if (!logChannel) return;
        
        const logEmbed = new Discord.EmbedBuilder()
            .setTitle('📋 Automod Action')
            .setColor(client.config?.colors?.normal || 0x2F3136)
            .addFields(
                { name: 'User', value: `${message.author} (${message.author.id})`, inline: true },
                { name: 'Channel', value: `${message.channel} (${message.channel.id})`, inline: true },
                { name: 'Rule Type', value: rule.type, inline: true },
                { name: 'Action', value: action.type, inline: true },
                { name: 'Reason', value: violation.reason || 'Automod violation', inline: true }
            )
            .setTimestamp();
        
        // Add message content
        if (message.content) {
            logEmbed.addFields({ 
                name: 'Message Content', 
                value: message.content.length > 1024 
                    ? message.content.substring(0, 1021) + '...' 
                    : message.content
            });
        }
        
        // Send log message
        await logChannel.send({ embeds: [logEmbed] });
        
    } catch (error) {
        console.error('Error logging automod action:', error);
    }
}

module.exports = (client) => {
    // Process new messages
    client.on(Discord.Events.MessageCreate, async (message) => {
        await handleMessage(client, message);
    });
    
    // Process edited messages
    client.on(Discord.Events.MessageUpdate, async (oldMessage, newMessage) => {
        // Skip if content hasn't changed
        if (oldMessage.content === newMessage.content) return;
        await handleMessage(client, newMessage, true);
    });
};