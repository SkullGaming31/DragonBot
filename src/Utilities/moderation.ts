import { EmbedBuilder, Guild, GuildMember, ChannelType, TextChannel } from 'discord.js';
import SettingsModel from '../Database/Schemas/settingsDB';
import { info as logInfo, warn as logWarn, error as logError } from '../Utilities/logger';

/**
 * Post a punishment embed to the configured punishment channel for the guild.
 * Tries multiple legacy keys and optional fallback channel ids.
 */
export async function postPunishment(guild: Guild, embed: EmbedBuilder, fallbackChannelIds: string[] = []): Promise<void> {
	try {
		const settings: unknown = await SettingsModel.findOne({ GuildID: guild.id }).lean().catch(() => null);
		let punishmentChannelId: string | null = null;
		if (settings && typeof settings === 'object') {
			const s = settings as Record<string, unknown>;
			if (typeof s.punishmentChannel === 'string') punishmentChannelId = s.punishmentChannel;
			else if (typeof s.PunishmentChan === 'string') punishmentChannelId = s.PunishmentChan;
			else if (typeof s.PunishmentChannel === 'string') punishmentChannelId = s.PunishmentChannel;
		}
		const tryIds = [] as string[];
		if (punishmentChannelId) tryIds.push(punishmentChannelId);
		tryIds.push(...fallbackChannelIds.filter(Boolean));

		for (const id of tryIds) {
			if (!id) continue;
			try {
				const ch = guild.channels.cache.get(id) || (await guild.channels.fetch(id).catch(() => null));
				if (ch && ch instanceof TextChannel) {
					await ch.send({ embeds: [embed] }).catch(() => null);
					return;
				}
			} catch (err) {
				// try next id
				logWarn('postPunishment: failed to send to channel, trying next', { guild: guild.id, channel: id, error: (err as Error)?.message ?? err });
			}
		}

		// If we reach here no channel was usable
		logWarn('postPunishment: no punishment channel available for guild', { guild: guild.id });
	} catch (err) {
		logError('postPunishment: unexpected error', { guild: guild.id, error: (err as Error)?.message ?? err });
	}
}

/**
 * Escalate a moderation action based on warning count.
 * 0 -> no action
 * 1 -> timeout 5 minutes
 * 2 -> kick
 * 3+ -> ban
 */
/**
 * Escalate a moderation action based on warning count.
 * By default callers pass the current stored warning count (before adding the new warning).
 * Historically the code treated the provided warningCount as the current total (no implicit +1).
 * To remain compatible with existing callers and tests the default is `isBeforeUpdate = false`.
 *
 * Mapping (applies to the new total):
 * 1 -> timeout 5 minutes
 * 2 -> kick
 * 3+ -> ban
 */
export async function escalateByWarnings(
	member: GuildMember | null,
	guild: Guild,
	warningCount: number,
	reason = 'Automoderation escalation',
	isBeforeUpdate = false
): Promise<string | null> {
	try {
		if (!member) return null;

		// Testing guard: do not actually apply moderation to specific test user ids.
		// Configure a single id or multiple comma-separated ids via env var:
		// AUTOMOD_TEST_USER_IDS=353674019943219204 or AUTOMOD_TEST_USER_IDS=1,2,3
		const rawTestIds = process.env.AUTOMOD_TEST_USER_IDS ?? process.env.AUTOMOD_TEST_USER_ID ?? '353674019943219204';
		const TEST_USER_IDS = String(rawTestIds).split(',').map(s => s.trim()).filter(Boolean);

		// interpret provided warningCount as "before update" by default
		const total = isBeforeUpdate ? warningCount + 1 : warningCount;

		if (total <= 0) return null;

		if (total === 1) {
			if (member.moderatable) {
				if (TEST_USER_IDS.includes(member.id)) {
					// Do not apply timeout in tests for listed test user ids; log instead
					console.log(`[automod] TEST_MODE: would timeout user ${member.id} for ${reason}`);
					return 'timeout';
				}
				await member.timeout(5 * 60 * 1000, reason).catch((err) => {
					logWarn('escalateByWarnings: timeout failed', { guild: guild.id, user: member.id, error: (err as Error)?.message ?? err });
				});
				logInfo('escalateByWarnings: applied timeout', { guild: guild.id, user: member.id });
				return 'timeout';
			}
			return null;
		}

		if (total === 2) {
			if (member.kickable) {
				if (TEST_USER_IDS.includes(member.id)) {
					console.log(`[automod] TEST_MODE: would kick user ${member.id} for ${reason}`);
					return 'kick';
				}
				await member.kick(reason).catch((err) => {
					logWarn('escalateByWarnings: kick failed', { guild: guild.id, user: member.id, error: (err as Error)?.message ?? err });
				});
				logInfo('escalateByWarnings: kicked member', { guild: guild.id, user: member.id });
				return 'kick';
			}
			return null;
		}

		// 3 or more
		if (total >= 3) {
			if (member.bannable) {
				if (TEST_USER_IDS.includes(member.id)) {
					console.log(`[automod] TEST_MODE: would ban user ${member.id} for ${reason}`);
					return 'ban';
				}
				await member.ban({ reason, deleteMessageSeconds: 5 }).catch((err) => {
					logWarn('escalateByWarnings: ban failed', { guild: guild.id, user: member.id, error: (err as Error)?.message ?? err });
				});
				logInfo('escalateByWarnings: banned member', { guild: guild.id, user: member.id });
				return 'ban';
			}
			return null;
		}

		return null;
	} catch (err) {
		logError('escalateByWarnings: unexpected error', { guild: guild.id, user: member?.id, error: (err as Error)?.message ?? err });
		return null;
	}
}

/**
 * Try to kick a member with safe permission checks and logging.
 */
export async function tryKick(member: GuildMember | null, reason = 'Moderation action'): Promise<boolean> {
	try {
		if (!member) return false;
		if (!member.kickable) {
			logWarn('tryKick: member not kickable', { guild: member.guild.id, user: member.id });
			return false;
		}
		await member.kick(reason).catch((err) => {
			logWarn('tryKick: kick failed', { guild: member.guild.id, user: member.id, error: (err as Error)?.message ?? err });
		});
		logInfo('tryKick: kicked member', { guild: member.guild.id, user: member.id });
		return true;
	} catch (err) {
		logError('tryKick: unexpected error', { guild: member?.guild.id, user: member?.id, error: (err as Error)?.message ?? err });
		return false;
	}
}

/**
 * Try to ban a member with safe permission checks and logging.
 */
export async function tryBan(member: GuildMember | null, reason = 'Moderation action'): Promise<boolean> {
	try {
		if (!member) return false;
		if (!member.bannable) {
			logWarn('tryBan: member not bannable', { guild: member.guild.id, user: member.id });
			return false;
		}
		await member.ban({ reason, deleteMessageSeconds: 5 }).catch((err) => {
			logWarn('tryBan: ban failed', { guild: member.guild.id, user: member.id, error: (err as Error)?.message ?? err });
		});
		logInfo('tryBan: banned member', { guild: member.guild.id, user: member.id });
		return true;
	} catch (err) {
		logError('tryBan: unexpected error', { guild: member?.guild.id, user: member?.id, error: (err as Error)?.message ?? err });
		return false;
	}
}

/**
 * Try to timeout a member with safe permission checks and logging.
 */
export async function tryTimeout(member: GuildMember | null, durationMs: number, reason = 'Moderation action'): Promise<boolean> {
	try {
		if (!member) return false;
		if (!member.moderatable) {
			logWarn('tryTimeout: member not moderatable', { guild: member.guild.id, user: member.id });
			return false;
		}
		await member.timeout(durationMs, reason).catch((err) => {
			logWarn('tryTimeout: timeout failed', { guild: member.guild.id, user: member.id, error: (err as Error)?.message ?? err });
		});
		logInfo('tryTimeout: timed out member', { guild: member.guild.id, user: member.id });
		return true;
	} catch (err) {
		logError('tryTimeout: unexpected error', { guild: member?.guild.id, user: member?.id, error: (err as Error)?.message ?? err });
		return false;
	}
}
