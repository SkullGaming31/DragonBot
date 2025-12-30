/* eslint-disable no-useless-escape -- quickfix: regex literal contains escaped slashes for readability */
import { ChannelType, EmbedBuilder, Message, PermissionsBitField } from 'discord.js';
import settings from '../../Database/Schemas/settingsDB';
import AutoModModel from '../../Database/Schemas/autoMod';
import { postPunishment, tryKick } from '../../Utilities/moderation';
import { Event } from '../../Structures/Event';
import { info as logInfo, warn as logWarn, error as logError } from '../../Utilities/logger';

// Link whitelist using an object
type LinkPattern = RegExp;

const linkWhitelist: { [domain: string]: LinkPattern } = {
	// Existing allowed links
	'twitch.tv': /^(https?:\/\/)?(www\.)?twitch\.tv\//i,
	'fb.gg': /^(https?:\/\/)?(www\.)?fb\.gg\//i,
	'api.twitch.tv': /^(https?:\/\/)?(www\.)?api\.twitch\.tv\//i,

	// New allowed links
	'twitter.com': /^(https?:\/\/)?(www\.)?twitter\.com\//i,
	'x.com': /^(https?:\/\/)?(www\.)?x\.com\//i,
	'instagram.com': /^(https?:\/\/)?(www\.)?instagram\.com\//i,
	'tiktok.com': /^(https?:\/\/)?(www\.)?tiktok\.com\//i,
	'github.com': /^(https?:\/\/)?(www\.)?github\.com\//i,
	'kick.com': /^(https?:\/\/)?(www\.)?kick\.com\//i,
};

// Cooldown map for link posting frequency (tracks count + window start)
type LinkCooldown = { count: number; windowStart: number };
const linkCooldowns = new Map<string, LinkCooldown>();
const LINK_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const LINK_THRESHOLD = 3;

export default new Event<'messageCreate'>('messageCreate', async (message: Message) => {
	// Destructure message properties for convenience
	const { guild, channel, author, content, member } = message;

	// Ignore bot messages and messages outside guilds
	if (author.bot || !guild) return;

	// Fetch guild settings from database (guarded)
	let settingsData = null;
	try {
		settingsData = await settings.findOne({ GuildID: guild.id }).lean().exec();
	} catch (err) {
		logError('twitchDetection: failed to read settings', { guild: guild.id, error: (err as Error)?.message ?? err });
		return;
	}
	if (!settingsData) return;

	// Extract promotion and punishment channel IDs
	const promotionChannelId = settingsData.PromotionChannel;
	const punishmentChannelId = settingsData.punishmentChannel ?? '';

	// Skip processing when message is posted in the promotion channel (links are allowed there).
	// If no promotionChannelId is configured, enforcement will apply across all channels.
	if (promotionChannelId && channel.id === promotionChannelId) return;

	// Quick check for link-like content
	if (!content || !/(https?:\/\/|www\.|\.[a-z]{2,}\b)/i.test(content)) return;

	// Check if author is moderator, admin, or guild owner
	const isModeratorOrAdmin = member?.permissions?.has?.(PermissionsBitField.Flags.Administrator) || member?.roles.cache.some((role) => role.name === 'Moderator' || role.name === 'Admin');
	if (guild.ownerId === author.id || isModeratorOrAdmin) return;

	// Extract URLs from content (basic extraction, supports http(s) and protocol-less domains)
	const urlRegex = /(?:https?:\/\/)?(?:www\.)?[\w.-]+\.[a-z]{2,}(?:\/[\w\-._~:\/?#[\]@!$&'()*+,;=%]*)?/gi;
	const found = Array.from(new Set((content.match(urlRegex) || []).map((s) => s.trim())));
	if (found.length === 0) return;

	// Function to check if a link is allowed by comparing hostname endings
	const isLinkAllowed = (raw: string) => {
		try {
			const candidate = raw.startsWith('http') ? raw : `https://${raw}`;
			const u = new URL(candidate);
			const hostname = u.hostname.toLowerCase();
			return Object.keys(linkWhitelist).some((k) => hostname === k || hostname.endsWith(`.${k}`));
		} catch (err) {
			return false;
		}
	};

	// Function to handle invalid link detection
	const handleInvalidLink = async () => {
		const channelMention = promotionChannelId
			? (guild.channels.cache.get(promotionChannelId)?.toString() ?? `#${promotionChannelId}`)
			: 'the promotion channel';
		const linkDetectionEmbed = new EmbedBuilder()
			.setTitle('Link Detected')
			.setDescription(`:x: ${author.username} **Links are only allowed in ${channelMention}**`)
			.setColor('Red')
			.setFooter({ text: guild.name })
			.setThumbnail(author.displayAvatarURL({ size: 512 }) ?? undefined)
			.setTimestamp();

		try {
			// Send warning embed
			await message.reply({ embeds: [linkDetectionEmbed] }).catch((err) => logWarn('twitchDetection: reply failed', { guild: guild.id, user: author.id, error: (err as Error)?.message ?? err }));

			// Update cooldown state
			const now = Date.now();
			const state = linkCooldowns.get(author.id);
			if (!state || now - state.windowStart >= LINK_WINDOW_MS) {
				linkCooldowns.set(author.id, { count: 1, windowStart: now });
			} else {
				state.count += 1;
				linkCooldowns.set(author.id, state);
			}

			const currentState = linkCooldowns.get(author.id)!;
			logInfo('twitchDetection: link count updated', { guild: guild.id, user: author.id, state: currentState });

			// Check for threshold and take action if exceeded
			if (currentState.count >= LINK_THRESHOLD) {
				// Attempt to fetch the member if not cached
				const kickMember = guild.members.cache.get(author.id) || (await guild.members.fetch(author.id).catch(() => null));

				if (kickMember) {
					const punishmentChannel = guild.channels.cache.get(punishmentChannelId) || (await guild.channels.fetch(punishmentChannelId).catch(() => null));
					const defaultPunishmentChannel = guild.channels.cache.get('959693430647308295') || (await guild.channels.fetch('959693430647308295').catch(() => null));

					const punishmentEmbed = new EmbedBuilder()
						.setTitle('Discord Event[LINK SPAM]')
						.setDescription(`:x: ${author.username} has been kicked for posting too many links.`)
						.setColor('Red')
						.setFooter({ text: guild.name })
						.setThumbnail(author.displayAvatarURL({ size: 512 }) ?? undefined)
						.setTimestamp();

					// Post punishment embed (best-effort) and attempt safe kick
					try {
						await postPunishment(guild, punishmentEmbed, ['959693430647308295']).catch(() => null);
					} catch { /* swallow */ }

					try {
						await tryKick(kickMember, 'Link spam');
					} catch { /* swallow */ }
				}

				// Delete original message if appropriate
				if (channel.type === ChannelType.GuildText) {
					await message.delete().catch((err) => logWarn('twitchDetection: failed to delete message', { guild: guild.id, user: author.id, error: (err as Error)?.message ?? err }));
				}
			}
		} catch (err) {
			logError('twitchDetection: handleInvalidLink unexpected error', { guild: guild.id, user: author.id, error: (err as Error)?.message ?? err });
		}
	};

	// Consult AutoMod config for link spam thresholds and ignored lists (optional)
	let autoModConfig = null;
	try {
		autoModConfig = await AutoModModel.findOne({ guildId: guild.id }).lean().catch(() => null);
	} catch (err) {
		logWarn('twitchDetection: failed to read automod config', { guild: guild.id, error: (err as Error)?.message ?? err });
	}

	// honor ignored channels/users/roles
	if (autoModConfig) {
		if (autoModConfig.ignoredChannels?.includes(channel.id)) return;
		if (autoModConfig.ignoredUsers?.includes(author.id)) return;
		if (member && member.roles && member.roles.cache) {
			const memberRoles = member.roles.cache.map(r => r.id);
			if (memberRoles.some(r => autoModConfig.ignoredRoles?.includes(r))) return;
		}
	}

	// If promotionChannelId is set, links posted outside that channel are disallowed (enforce on any link).
	const isInPromotionChannel = promotionChannelId ? channel.id === promotionChannelId : false;

	if (!isInPromotionChannel) {
		// Any link posted outside the promotion channel is invalid — enforce immediately
		await handleInvalidLink();
	} else {
		// Inside the promotion channel use the whitelist + cooldown logic
		const anyNotAllowed = found.some((u) => !isLinkAllowed(u));
		if (anyNotAllowed) {
			// override threshold if automod config provides spam threshold
			if (autoModConfig && autoModConfig.rules && autoModConfig.rules.spam && typeof autoModConfig.rules.spam.threshold === 'number') {
				// use the automod spam threshold as a multiplier to link threshold (simple policy)
				const overrideThreshold = Math.max(1, Math.floor(autoModConfig.rules.spam.threshold));
				if ((linkCooldowns.get(author.id)?.count ?? 0) + 1 >= overrideThreshold) {
					await handleInvalidLink();
				}
			} else {
				await handleInvalidLink();
			}
		}
	}

	// Clean up expired cooldown windows
	const state = linkCooldowns.get(author.id);
	if (state && Date.now() - state.windowStart >= LINK_WINDOW_MS) linkCooldowns.delete(author.id);
});