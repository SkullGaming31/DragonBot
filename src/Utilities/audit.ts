import { EmbedBuilder, Guild, TextBasedChannel, ChannelType } from 'discord.js';
import ChanLogger from '../Database/Schemas/LogsChannelDB';
import { info, error as logError, warn } from './logger';

/**
 * Send an embed to the configured logs channel for a guild, if logging is enabled.
 *
 * @param guild Guild to look up LogsChannelDB for
 * @param embed Embed to send
 * @param skipIfFromChannelId Optional channel id; if the event originated from the logs channel, skip sending to avoid loops
 * @returns true if the embed was sent, false otherwise
 */
export async function sendGuildLog(guild: Guild, embed: EmbedBuilder, skipIfFromChannelId?: string): Promise<boolean> {
	try {
		const cfg = await ChanLogger.findOne({ Guild: guild.id }).catch(() => null);
		if (!cfg || cfg.enableLogs === false) return false;
		const logsChannelID = cfg.Channel;
		if (!logsChannelID) return false;
		if (skipIfFromChannelId && String(skipIfFromChannelId) === String(logsChannelID)) return false;

		let logsChannel = guild.channels.cache.get(logsChannelID as string) as TextBasedChannel | undefined;
		if (!logsChannel) {
			// try fetch
			logsChannel = await guild.channels.fetch(logsChannelID as string).catch(() => undefined) as TextBasedChannel | undefined;
		}
		if (!logsChannel) return false;
		if (logsChannel.type !== ChannelType.GuildText) {
			warn('audit: configured logs channel is not a text channel', { guildId: guild.id, logsChannelID });
			return false;
		}

		await logsChannel.send({ embeds: [embed] }).catch((e) => {
			// log but don't throw
			logError('audit: failed to send embed to logs channel', { guildId: guild.id, err: String(e) });
		});

		info('audit: sent embed to logs channel', { guildId: guild.id, logsChannelID });
		return true;
	} catch (err) {
		logError('audit: unexpected failure while sending guild log', { guildId: guild.id, err: (err as Error)?.message ?? String(err) });
		return false;
	}
}
