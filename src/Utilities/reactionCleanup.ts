import { Client, TextChannel } from 'discord.js';
import ReactionRoleModel from '../Database/Schemas/reactionRole';
import ReactionCleanupModel from '../Database/Schemas/reactionCleanupDB';
import { info, error as logError } from './logger';

type ReactionMapping = { _id: string; guildId: string; roleId?: string; channelId?: string; messageId?: string };

/**
 * Run one cleanup pass: find mappings and remove those pointing to missing roles or messages.
 */
export async function runReactionCleanup(client: Client) {
	try {
		const mappings = (await ReactionRoleModel.find({}).lean()) as unknown as ReactionMapping[] | null;
		if (!mappings || mappings.length === 0) return { checked: 0, removed: 0 };

		let totalChecked = 0;
		let totalRemoved = 0;
		const perGuild: Record<string, { checked: number; removed: number }> = {};

		// Group by guild to reduce fetches
		const byGuild = new Map<string, ReactionMapping[]>();
		for (const m of mappings) {
			const arr = byGuild.get(m.guildId) ?? [];
			arr.push(m);
			byGuild.set(m.guildId, arr);
		}

		for (const [guildId, maps] of byGuild.entries()) {
			const guild = client.guilds.cache.get(guildId) ?? await client.guilds.fetch(guildId).catch(() => undefined);
			if (!guild) continue; // can't validate without guild

			perGuild[guildId] = perGuild[guildId] ?? { checked: 0, removed: 0 };
			for (const map of maps) {
				totalChecked++;
				perGuild[guildId].checked++;
				try {
					// check role
					let roleExists = false;
					try {
						// GuildRoleManager has cache and fetch
						roleExists = guild.roles.cache.has(String(map.roleId));
						if (!roleExists) {
							const fetchedRole = await guild.roles.fetch(String(map.roleId)).catch(() => undefined);
							roleExists = !!fetchedRole;
						}
					} catch {
						roleExists = false;
					}

					if (!roleExists) {
						const res = await ReactionRoleModel.deleteOne({ _id: map._id }).catch(() => null) as { deletedCount?: number } | null;
						if (res && typeof res.deletedCount === 'number' && res.deletedCount > 0) {
							totalRemoved++;
							perGuild[guildId].removed++;
						}
						info('reactionCleanup: removed mapping with missing role', { guildId, mappingId: map._id, roleId: map.roleId });
						continue;
					}

					// check message exists
					const channelId = map.channelId;
					if (!channelId) {
						await ReactionRoleModel.deleteOne({ _id: map._id }).catch(() => null);
						info('reactionCleanup: removed mapping missing channelId', { guildId, mappingId: map._id });
						continue;
					}

					let channel = guild.channels.cache.get(channelId) as TextChannel | undefined;
					if (!channel && typeof guild.channels.fetch === 'function') {
						channel = await guild.channels.fetch(channelId).catch(() => undefined) as TextChannel | undefined;
					}

					if (!channel) {
						const res = await ReactionRoleModel.deleteOne({ _id: map._id }).catch(() => null) as { deletedCount?: number } | null;
						if (res && typeof res.deletedCount === 'number' && res.deletedCount > 0) {
							totalRemoved++;
							perGuild[guildId].removed++;
						}
						info('reactionCleanup: removed mapping missing channel', { guildId, mappingId: map._id, channelId });
						continue;
					}

					if (typeof channel.messages?.fetch !== 'function') continue;
					// ensure messageId is present before calling fetch (avoids TS overload error)
					if (!map.messageId) {
						const res = await ReactionRoleModel.deleteOne({ _id: map._id }).catch(() => null) as { deletedCount?: number } | null;
						if (res && typeof res.deletedCount === 'number' && res.deletedCount > 0) {
							totalRemoved++;
							perGuild[guildId].removed++;
						}
						info('reactionCleanup: removed mapping missing messageId', { guildId, mappingId: map._id });
						continue;
					}
					const msg = await channel.messages.fetch(String(map.messageId)).catch(() => undefined);
					if (!msg) {
						const res = await ReactionRoleModel.deleteOne({ _id: map._id }).catch(() => null) as { deletedCount?: number } | null;
						if (res && typeof res.deletedCount === 'number' && res.deletedCount > 0) {
							totalRemoved++;
							perGuild[guildId].removed++;
						}
						info('reactionCleanup: removed mapping missing message', { guildId, mappingId: map._id, messageId: map.messageId });
						continue;
					}
				} catch (err) {
					logError('reactionCleanup: error validating mapping', { err: (err as Error)?.message ?? err, guildId, mappingId: map._id });
				}
			}
			// persist per-guild stats for this guild
			try {
				await ReactionCleanupModel.findOneAndUpdate({ Guild: guildId }, { Guild: guildId, lastRunAt: new Date(), lastChecked: perGuild[guildId].checked, lastRemoved: perGuild[guildId].removed }, { upsert: true }).catch(() => null);
			} catch (err) {
				logError('reactionCleanup: failed to persist stats', { err: (err as Error)?.message ?? err, guildId });
			}
		}
		return { checked: totalChecked, removed: totalRemoved, perGuild };
	} catch (err) {
		logError('runReactionCleanup: failed to query mappings', { err: (err as Error)?.message ?? err });
		return { checked: 0, removed: 0, perGuild: {} };
	}
}

/**
 * Start a periodic cleanup job. Interval can be configured with REACTION_CLEANUP_INTERVAL_MINUTES env var.
 */
export function startReactionCleanup(client: Client) {
	const minutes = Number(process.env.REACTION_CLEANUP_INTERVAL_MINUTES) || 60; // default hourly
	const ms = Math.max(1, minutes) * 60 * 1000;
	// Run once at startup then interval
	runReactionCleanup(client).catch(() => null);
	const id = setInterval(() => runReactionCleanup(client).catch(() => null), ms);
	// Return stop function
	return () => clearInterval(id);
}

export default { runReactionCleanup, startReactionCleanup };
