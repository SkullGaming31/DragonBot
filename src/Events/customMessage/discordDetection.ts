import { randomBytes } from 'crypto';
import { ChannelType, EmbedBuilder, Message } from 'discord.js';
import WarningDB from '../../Database/Schemas/WarnDB'; // Warning schema
import DB from '../../Database/Schemas/settingsDB';
import { Event } from '../../Structures/Event';
import { error as logError, info as logInfo, warn as logWarn } from '../../Utilities/logger';

export default new Event<'messageCreate'>('messageCreate', async (message: Message) => {
	try {
		if (!message.guild) return;
		const { channel, author, guild } = message;
		let member = message.member;

		if (author.bot) return;

		// Exempt channels can be configured via environment or fall back to the legacy ID
		const EXEMPT_CHANNELS = (process.env.EXEMPT_CHANNELS || '959693430647308292')
			.split(',')
			.map((c) => c.trim())
			.filter(Boolean);
		if (EXEMPT_CHANNELS.includes(channel.id)) return;

		// Don't moderate guild owner in prod
		if (!['dev', 'debug'].includes(process.env.Enviroment || '') && author.id === guild?.ownerId) return;

		// Load settings early (guarded)
		let SettingsDB = null;
		try {
			SettingsDB = await DB.findOne({ GuildID: guild.id }).lean().exec();
		} catch (err) {
			logError('discordDetection: failed to read settings DB', { guild: guild.id, error: (err as Error)?.message ?? err });
			return;
		}
		if (!SettingsDB) return;

		// Ensure we have a GuildMember object
		if (!member) {
			try {
				member = await guild.members.fetch(author.id).catch(() => null);
			} catch (fetchErr) {
				// Log fetch error and continue; member may remain undefined
				logWarn('[discordDetection] failed to fetch member', { guild: guild.id, user: author.id, error: (fetchErr as Error)?.message ?? fetchErr });
			}
		}

		const content = (message.content || '').trim();
		if (!content) return;

		// Improved regex: avoid capturing trailing punctuation-only matches
		const discordInviteRegex = /(?:https?:\/\/)?(?:www\.)?(?:discord(?:app)?\.(?:gg|com|io|me|gift)\/\S+|discordapp\.com\/invite\/\S+)/i;
		const isDiscordInvite = discordInviteRegex.test(content);
		if (!isDiscordInvite) return;

		// Build embed to DM / display
		const discordLinkDetection = new EmbedBuilder()
			.setTitle('Discord Link Detected')
			.setColor('Red')
			.setAuthor({ name: author.bot ? author.tag : (author.globalName || author.username || author.tag), iconURL: author.displayAvatarURL({ size: 512 }) })
			.setThumbnail(author.displayAvatarURL({ size: 512 }) ?? undefined)
			.setFooter({ text: `guild: ${guild.name}` })
			.setTimestamp();

		// Fetch current warnings (read-only) to decide punishment level
		let existing = null;
		try {
			existing = await WarningDB.findOne({ GuildID: guild.id, UserID: author.id }).lean().exec();
		} catch (err) {
			logError('discordDetection: failed to read WarningDB', { guild: guild.id, user: author.id, error: (err as Error)?.message ?? err });
		}
		const warningCount = existing?.Warnings?.length ?? 0;
		logInfo('[discordDetection] warningCount', { count: warningCount, user: author.id });

		// Decide punishment and attempt operations safely
		let warningMessage = 'This is a warning for posting Discord invite links.';

		if (channel.type === ChannelType.GuildText) {
			try {
				switch (warningCount) {
					case 0:
						warningMessage = 'This is your first warning. Please do not post Discord links in this server.';
						break;
					case 1:
						warningMessage = 'Second warning: you will be timed out for 5 minutes.';
						if (member?.moderatable) {
							await member.timeout(5 * 60 * 1000, 'Posted Discord invite after warning').catch((err) => {
								logWarn('[discordDetection] timeout failed', { guild: guild.id, user: author.id, error: (err as Error)?.message ?? err });
							});
						}
						break;
					case 2:
						warningMessage = 'Third warning: you will be kicked.';
						if (member?.kickable) {
							await member.kick('Posted Discord invite after multiple warnings').catch((err) => {
								logWarn('[discordDetection] kick failed', { guild: guild.id, user: author.id, error: (err as Error)?.message ?? err });
							});
						}
						break;
					default:
						warningMessage = 'You have exceeded the maximum number of warnings and may be banned.';
						if (member?.bannable) {
							await member.ban({ reason: 'Repeatedly posting Discord invite links', deleteMessageSeconds: 5 }).catch((err) => {
								logWarn('[discordDetection] ban failed', { guild: guild.id, user: author.id, error: (err as Error)?.message ?? err });
							});
						}
						break;
				}
			} catch (err) {
				logError('discordDetection: moderation action failed', { guild: guild.id, user: author.id, error: (err as Error)?.message ?? err });
			}

			// Create a new warning object and push to DB (upsert pattern)
			const newWarning = {
				WarningID: generateUniqueID(),
				Reason: 'Posting Discord Links',
				Source: 'bot',
				Date: new Date(),
			};

			try {
				await WarningDB.updateOne({ GuildID: guild.id, UserID: author.id }, { $push: { Warnings: newWarning } }, { upsert: true }).exec();
			} catch (err) {
				logError('discordDetection: failed to update WarningDB', { guild: guild.id, user: author.id, error: (err as Error)?.message ?? err });
			}

			// Notify the user in-channel and attempt to DM. Attempt reply first, then delete original message.
			try {
				await message.reply({ content: `${author}`, embeds: [discordLinkDetection.setDescription(warningMessage)] }).catch((err) => {
					logWarn('[discordDetection] failed to send channel reply', { guild: guild.id, user: author.id, error: (err as Error)?.message ?? err });
				});
			} catch (err) {
				logError('[discordDetection] reply error', { guild: guild.id, user: author.id, error: (err as Error)?.message ?? err });
			}

			try {
				await message.delete().catch((err) => {
					logWarn('[discordDetection] failed to delete message', { guild: guild.id, user: author.id, error: (err as Error)?.message ?? err });
				});
			} catch (err) {
				logError('[discordDetection] delete error', { guild: guild.id, user: author.id, error: (err as Error)?.message ?? err });
			}

			try {
				await author.send({ embeds: [discordLinkDetection.setDescription(warningMessage)] }).catch((err) => {
					logWarn('[discordDetection] failed to DM user', { guild: guild.id, user: author.id, error: (err as Error)?.message ?? err });
				});
			} catch (err) {
				logError('[discordDetection] DM error', { guild: guild.id, user: author.id, error: (err as Error)?.message ?? err });
			}
		}
	} catch (error) {
		logError('[discordDetection] unexpected error', { error: (error as Error)?.message ?? error });
	}
});

// Function to generate a random unique ID
function generateUniqueID(): string {
	return randomBytes(8).toString('hex');
}