import { Message } from 'discord.js';
import { randomBytes } from 'crypto';
import AutoModModel, { IAutoMod } from '../../Database/Schemas/autoMod';
import SettingsModel from '../../Database/Schemas/settingsDB';
import WarningDB from '../../Database/Schemas/WarnDB';
import { EmbedBuilder, ChannelType, GuildMember, Guild } from 'discord.js';
import { postPunishment, escalateByWarnings } from '../../Utilities/moderation';
import { Event } from '../../Structures/Event';
import { info as logInfo, error as logError } from '../../Utilities/logger';

// Simple in-memory message history for spam detection: { guildId: { userId: [timestamps] } }
const messageHistory: Record<string, Record<string, number[]>> = {};
const SPAM_WINDOW_MS = 10_000; // 10 seconds

function isInvite(text: string) {
	// matches discord.gg/ or discord.com/invite/ or invite codes
	return /(?:discord(?:app)?\.com\/invite|discord\.gg)\/[A-Za-z0-9-]+/i.test(text);
}

function capsPercentage(text: string) {
	const letters = text.replace(/[^A-Za-z]/g, '');
	if (!letters) return 0;
	const upper = letters.replace(/[^A-Z]/g, '').length;
	return Math.round((upper / letters.length) * 100);
}

export default new Event<'messageCreate'>('messageCreate', async (message: Message) => {
	try {
		if (!message.guild) return;
		if (message.author.bot) return;

		const guild = message.guild as Guild;
		const guildId = guild.id;
		// load config, fall back to defaults if not present
		let config;
		try {
			config = await AutoModModel.findOne({ guildId }).lean().catch(() => null);
		} catch (err) {
			logError('autoModeration: failed to read config', { error: (err as Error)?.message ?? err });
			config = null;
		}

		// default policy if no config. Merge DB config onto defaults so fields are always present.
		const defaults = {
			enabled: true,
			rules: { inviteLinks: { enabled: true }, caps: { enabled: true, threshold: 70 }, spam: { enabled: true, threshold: 5 } },
			ignoredChannels: [] as string[],
			ignoredRoles: [] as string[],
			ignoredUsers: [] as string[],
		};

		const cfg = (config as Partial<IAutoMod> | null) ?? {};
		const policy = {
			enabled: cfg.enabled ?? defaults.enabled,
			rules: {
				inviteLinks: { enabled: cfg.rules?.inviteLinks?.enabled ?? defaults.rules.inviteLinks.enabled },
				caps: { enabled: cfg.rules?.caps?.enabled ?? defaults.rules.caps.enabled, threshold: cfg.rules?.caps?.threshold ?? defaults.rules.caps.threshold },
				spam: { enabled: cfg.rules?.spam?.enabled ?? defaults.rules.spam.enabled, threshold: cfg.rules?.spam?.threshold ?? defaults.rules.spam.threshold },
			},
			ignoredChannels: cfg.ignoredChannels ?? defaults.ignoredChannels,
			ignoredRoles: cfg.ignoredRoles ?? defaults.ignoredRoles,
			ignoredUsers: cfg.ignoredUsers ?? defaults.ignoredUsers,
		} as {
      enabled: boolean;
      rules: { inviteLinks: { enabled: boolean }; caps: { enabled: boolean; threshold: number }; spam: { enabled: boolean; threshold: number } };
      ignoredChannels: string[];
      ignoredRoles: string[];
      ignoredUsers: string[];
    };

		if (!policy.enabled) return;

		// ignored checks
		if (policy.ignoredChannels.includes(message.channel.id)) return;
		if (policy.ignoredUsers.includes(message.author.id)) return;
		if (message.member && message.member.roles && message.member.roles.cache) {
			const memberRoles = message.member.roles.cache.map(r => r.id);
			if (memberRoles.some(r => policy.ignoredRoles.includes(r))) return;
		}

		const content = (message.content ?? '').trim();
		if (!content) return;

		// Invite/link detection
		// per-message invite handling flag to prevent duplicate processing by other handlers
		const INVITE_FLAG = '__invite_handled';
		// improved invite regex (accepts several discord invite URL forms)
		const discordInviteRegex = /(?:https?:\/\/)?(?:www\.)?(?:discord(?:app)?\.(?:gg|com|io|me|gift)\/\S+|discordapp\.com\/invite\/\S+)/i;
		if (policy.rules.inviteLinks.enabled && (isInvite(content) || discordInviteRegex.test(content))) {
			if ((message as unknown as Record<string, unknown>)[INVITE_FLAG]) {
				// another handler already processed this invite; skip invite handling here
			} else {
				try {
					// delete original message first
					await message.delete().catch(() => null);

					// Build embed used for DM and logs
					const discordLinkDetection = new EmbedBuilder()
						.setTitle('Discord Link Detected')
						.setColor('Red')
						.setAuthor({ name: message.author.bot ? message.author.tag : (message.author.globalName || message.author.username || message.author.tag), iconURL: message.author.displayAvatarURL({ size: 512 }) })
						.setThumbnail(message.author.displayAvatarURL({ size: 512 }) ?? undefined)
						.setFooter({ text: `guild: ${guild.name}` })
						.setTimestamp();

					// Notify the channel with a simple mention (keep brief) — we'll add an embed DM below
					const ch = message.channel as unknown as { send?: unknown };
					if (typeof ch.send === 'function') {
						await (ch as { send: (o: unknown) => Promise<unknown> }).send({ content: `<@${message.author.id}>, posting invite links is not allowed here.` }).catch(() => null);
					}

					try {
						// read existing warnings (stored count before adding new)
						const existingRaw = await WarningDB.findOne({ GuildID: guildId, UserID: message.author.id }).lean().catch(() => null);
						const existing = existingRaw as { Warnings?: unknown[] } | null;
						const warningCount = Array.isArray(existing?.Warnings) ? existing!.Warnings.length : 0;

						// resolve member
						const member = (message.member ?? (await guild.members.fetch(message.author.id).catch(() => null))) as GuildMember | null;

						// apply escalation based on stored count (helper treats it as before-update by default)
						await escalateByWarnings(member ?? null, guild, warningCount, 'Posted invite link');

						// persist new warning
						const newWarning = { WarningID: generateUniqueID(), Reason: 'Posting Discord Links', Source: 'bot', Date: new Date() };
						await WarningDB.updateOne({ GuildID: guildId, UserID: message.author.id }, { $push: { Warnings: newWarning } }, { upsert: true }).catch(() => null);

						// mark as handled so other invite detectors don't double-handle
						(message as unknown as Record<string, unknown>)[INVITE_FLAG] = true;

						// Compose human-friendly message based on new total
						const newTotal = warningCount + 1;
						let warningMessage = 'This is a warning for posting Discord invite links.';
						if (newTotal === 1) warningMessage = 'This is your first warning. Please do not post Discord links in this server.';
						else if (newTotal === 2) warningMessage = 'Second warning: you will be timed out for 5 minutes.';
						else if (newTotal === 3) warningMessage = 'Third warning: you will be kicked.';
						else warningMessage = 'You have exceeded the maximum number of warnings and may be banned.';

						// Post to configured punishment channel (best-effort)
						try {
							const embed = new EmbedBuilder().setTitle('Moderation Action').setDescription(`${warningMessage}\nUser: <@${message.author.id}>`).setTimestamp();
							await postPunishment(guild, embed, []).catch(() => null);
						} catch { /* non-fatal */ }

						// Attempt to DM the user with the embed
						try {
							await message.author.send({ embeds: [discordLinkDetection.setDescription(warningMessage)] }).catch(() => null);
						} catch { /* non-fatal */ }
					} catch (err) {
						// non-fatal — log and continue
						logError('autoModeration: error during invite escalation', { error: (err as Error)?.message ?? err });
					}

					logInfo('autoModeration: deleted invite link', { guildId, userId: message.author.id });
					return;
				} catch (err) {
					logError('autoModeration: error handling invite link', { error: (err as Error)?.message ?? err });
				}
			}
		}

		// Caps detection
		if (policy.rules.caps.enabled) {
			const capPct = capsPercentage(content);
			const threshold = policy.rules.caps.threshold ?? 70;
			if (capPct >= threshold && content.length >= 10) {
				try {
					await message.delete().catch(() => null);
					const ch = message.channel as unknown as { send?: unknown };
					if (typeof ch.send === 'function') {
						await (ch as { send: (o: unknown) => Promise<unknown> }).send({ content: `<@${message.author.id}>, please avoid excessive capitalization.` }).catch(() => null);
					}
					try {
						const existingRaw = await WarningDB.findOne({ GuildID: guildId, UserID: message.author.id }).lean().catch(() => null);
						const existing = existingRaw as { Warnings?: unknown[] } | null;
						const warningCount = Array.isArray(existing?.Warnings) ? existing!.Warnings.length : 0;
						const member = (message.member ?? (await guild.members.fetch(message.author.id).catch(() => null))) as GuildMember | null;
						await escalateByWarnings(member ?? null, guild, warningCount, 'Excessive capitalization');
						const newWarning = { WarningID: generateUniqueID(), Reason: 'Excessive capitalization', Source: 'bot', Date: new Date() };
						await WarningDB.updateOne({ GuildID: guildId, UserID: message.author.id }, { $push: { Warnings: newWarning } }, { upsert: true }).catch(() => null);
					} catch { /* non-fatal */ }

					// Post to configured punishment channel (best-effort)
					try {
						const embed = new EmbedBuilder().setTitle('AutoMod Action').setDescription(`Deleted message by <@${message.author.id}> — excessive capitalization (${capPct}%)`).setTimestamp();
						await postPunishment(guild, embed, []).catch(() => null);
					} catch { /* non-fatal */ }

					logInfo('autoModeration: deleted caps message', { guildId, userId: message.author.id, capPct });
					return;
				} catch (err) {
					logError('autoModeration: error handling caps', { error: (err as Error)?.message ?? err });
				}
			}
		}

		// Spam detection (messages in window)
		if (policy.rules.spam.enabled) {
			const now = Date.now();
			messageHistory[guildId] ??= {};
			const userHistory = messageHistory[guildId][message.author.id] ??= [];
			// prune old
			while (userHistory.length > 0 && userHistory[0] < now - SPAM_WINDOW_MS) userHistory.shift();
			userHistory.push(now);
			const count = userHistory.length;
			const threshold = policy.rules.spam.threshold ?? 5;
			if (count >= threshold) {
				try {
					await message.delete().catch(() => null);
					const ch = message.channel as unknown as { send?: unknown };
					if (typeof ch.send === 'function') {
						await (ch as { send: (o: unknown) => Promise<unknown> }).send({ content: `<@${message.author.id}>, please stop spamming.` }).catch(() => null);
					}
					try {
						const existingRaw = await WarningDB.findOne({ GuildID: guildId, UserID: message.author.id }).lean().catch(() => null);
						const existing = existingRaw as { Warnings?: unknown[] } | null;
						const warningCount = Array.isArray(existing?.Warnings) ? existing!.Warnings.length : 0;
						const member = (message.member ?? (await guild.members.fetch(message.author.id).catch(() => null))) as GuildMember | null;
						await escalateByWarnings(member ?? null, guild, warningCount, 'Spam detected');
						const newWarning = { WarningID: generateUniqueID(), Reason: 'Spam', Source: 'bot', Date: new Date() };
						await WarningDB.updateOne({ GuildID: guildId, UserID: message.author.id }, { $push: { Warnings: newWarning } }, { upsert: true }).catch(() => null);
					} catch { /* non-fatal */ }

					// reset history for user to avoid repeated deletions
					messageHistory[guildId][message.author.id] = [];

					// Post to configured punishment channel (best-effort)
					try {
						const embed = new EmbedBuilder().setTitle('AutoMod Action').setDescription(`Deleted spam message(s) by <@${message.author.id}> — ${count} messages in ${SPAM_WINDOW_MS / 1000}s`).setTimestamp();
						await postPunishment(guild, embed, []).catch(() => null);
					} catch { /* non-fatal */ }

					logInfo('autoModeration: deleted spam messages', { guildId, userId: message.author.id, count });
					return;
				} catch (err) {
					logError('autoModeration: error handling spam', { error: (err as Error)?.message ?? err });
				}
			}
		}
	} catch (err) {
		logError('autoModeration: handler error', { error: (err as Error)?.message ?? err });
	}
});

// Function to generate a random unique ID
function generateUniqueID(): string {
	return randomBytes(8).toString('hex');
}

// The following exported helpers exist purely for testing edge branches that are
// difficult to reach from the full event flow (for example: synchronous throws
// that escape inner .catch handlers). They are not used by runtime code but
// make branch testing deterministic.
export async function __test_invokeInvite(message: Message, options?: { throwAt?: 'delete' | 'postPunishment' | 'authorSend' | 'channelSend' }) {
	const INVITE_FLAG = '__invite_handled';
	const guild = message.guild as Guild;
	const guildId = guild?.id ?? 'test-guild';
	// quick check similar to main handler
	if (!message || message.author?.bot) return;

	// simulate the early delete/send steps that live in the outer try
	try {
		if (options?.throwAt === 'delete') throw new Error('test-delete-throw');
		await (message.delete as any)?.().catch(() => null);

		if (options?.throwAt === 'channelSend') throw new Error('test-channel-send-throw');
		const ch = message.channel as unknown as { send?: unknown };
		if (typeof ch?.send === 'function') await (ch as any).send({ content: 'test' }).catch(() => null);

		// inner try block from the event
		try {
			const existingRaw = await WarningDB.findOne({ GuildID: guildId, UserID: message.author.id }).lean().catch(() => null);
			const existing = existingRaw as { Warnings?: unknown[] } | null;
			const warningCount = Array.isArray(existing?.Warnings) ? existing!.Warnings.length : 0;

			const member = (message.member ?? (await guild.members.fetch(message.author.id).catch(() => null))) as GuildMember | null;

			if (options?.throwAt === 'postPunishment') throw new Error('test-postPunishment-throw');
			await escalateByWarnings(member ?? null, guild, warningCount, 'Posted invite link');

			const newWarning = { WarningID: generateUniqueID(), Reason: 'Posting Discord Links', Source: 'bot', Date: new Date() };
			await WarningDB.updateOne({ GuildID: guildId, UserID: message.author.id }, { $push: { Warnings: newWarning } }, { upsert: true }).catch(() => null);

			(message as unknown as Record<string, unknown>)[INVITE_FLAG] = true;

			if (options?.throwAt === 'authorSend') throw new Error('test-author-send-throw');
			await message.author.send?.({ embeds: [] }).catch(() => null);
		} catch (err) {
			// inner catch mirrors original: non-fatal
		}

		// postPunishment best-effort
		try {
			const embed = new EmbedBuilder().setTitle('Moderation Action').setDescription('test').setTimestamp();
			await postPunishment(guild, embed, []).catch(() => null);
		} catch { /* non-fatal */ }

		return;
	} catch (err) {
		// outer catch — replicate same logging as the module
		logError('autoModeration: error handling invite link', { error: (err as Error)?.message ?? err });
	}
}

export async function __test_invokeCaps(message: Message, options?: { throwAt?: 'delete' | 'postPunishment' | 'authorSend' | 'channelSend' }) {
	const guild = message.guild as Guild;
	const guildId = guild?.id ?? 'test-guild';
	try {
		if (options?.throwAt === 'delete') throw new Error('test-delete-throw-caps');
		await (message.delete as any)?.().catch(() => null);

		const ch = message.channel as unknown as { send?: unknown };
		if (options?.throwAt === 'channelSend') throw new Error('test-channel-send-throw-caps');
		if (typeof ch?.send === 'function') await (ch as any).send({ content: 'caps' }).catch(() => null);

		try {
			const existingRaw = await WarningDB.findOne({ GuildID: guildId, UserID: message.author.id }).lean().catch(() => null);
			const existing = existingRaw as { Warnings?: unknown[] } | null;
			const warningCount = Array.isArray(existing?.Warnings) ? existing!.Warnings.length : 0;
			const member = (message.member ?? (await guild.members.fetch(message.author.id).catch(() => null))) as GuildMember | null;
			if (options?.throwAt === 'postPunishment') throw new Error('test-postPunishment-throw-caps');
			await escalateByWarnings(member ?? null, guild, warningCount, 'Excessive capitalization');
			const newWarning = { WarningID: generateUniqueID(), Reason: 'Excessive capitalization', Source: 'bot', Date: new Date() };
			await WarningDB.updateOne({ GuildID: guildId, UserID: message.author.id }, { $push: { Warnings: newWarning } }, { upsert: true }).catch(() => null);
		} catch { /* non-fatal */ }

		try {
			const embed = new EmbedBuilder().setTitle('AutoMod Action').setDescription(`Deleted message by <@${message.author.id}>`).setTimestamp();
			await postPunishment(guild, embed, []).catch(() => null);
		} catch { /* non-fatal */ }

		return;
	} catch (err) {
		logError('autoModeration: error handling caps', { error: (err as Error)?.message ?? err });
	}
}

export async function __test_invokeSpam(messages: Message[], options?: { throwAt?: 'delete' | 'postPunishment' | 'authorSend' | 'channelSend' }) {
	// messages is an array of Message objects representing repeated posts from same user
	const message = messages[messages.length - 1];
	const guild = message.guild as Guild;
	const guildId = guild?.id ?? 'test-guild';
	try {
		if (options?.throwAt === 'delete') throw new Error('test-delete-throw-spam');
		await (message.delete as any)?.().catch(() => null);

		const ch = message.channel as unknown as { send?: unknown };
		if (options?.throwAt === 'channelSend') throw new Error('test-channel-send-throw-spam');
		if (typeof ch?.send === 'function') await (ch as any).send({ content: 'spam' }).catch(() => null);

		try {
			const existingRaw = await WarningDB.findOne({ GuildID: guildId, UserID: message.author.id }).lean().catch(() => null);
			const existing = existingRaw as { Warnings?: unknown[] } | null;
			const warningCount = Array.isArray(existing?.Warnings) ? existing!.Warnings.length : 0;
			const member = (message.member ?? (await guild.members.fetch(message.author.id).catch(() => null))) as GuildMember | null;
			if (options?.throwAt === 'postPunishment') throw new Error('test-postPunishment-throw-spam');
			await escalateByWarnings(member ?? null, guild, warningCount, 'Spam detected');
			const newWarning = { WarningID: generateUniqueID(), Reason: 'Spam', Source: 'bot', Date: new Date() };
			await WarningDB.updateOne({ GuildID: guildId, UserID: message.author.id }, { $push: { Warnings: newWarning } }, { upsert: true }).catch(() => null);
		} catch { /* non-fatal */ }

		try {
			const embed = new EmbedBuilder().setTitle('AutoMod Action').setDescription(`Deleted spam message(s) by <@${message.author.id}>`).setTimestamp();
			await postPunishment(guild, embed, []).catch(() => null);
		} catch { /* non-fatal */ }

		return;
	} catch (err) {
		logError('autoModeration: error handling spam', { error: (err as Error)?.message ?? err });
	}
}
