import { ChannelType, EmbedBuilder, GuildBan, TextBasedChannel } from 'discord.js';
import axios from 'axios';

import ChanLogger from '../../Database/Schemas/LogsChannelDB'; // DB
import { Event } from '../../Structures/Event';
import { error as logError, info as logInfo } from '../../Utilities/logger';

export default new Event<'guildBanAdd'>('guildBanAdd', async (ban: GuildBan) => {
	const { guild, user } = ban;

	// Best-effort: post incident to dashboard
	void (async () => {
		try {
			const url = process.env.AUTOMOD_DASHBOARD_URL;
			const secret = process.env.INTERNAL_SECRET;
			if (url) {
				const reason = ban.reason ?? 'No reason provided';
				await axios.post(
					`${url.replace(/\/$/, '')}/api/v1/automod/${guild.id}/incidents`,
					{ userId: user?.id, userDisplayName: user?.globalName ?? user?.username ?? user?.tag, action: 'ban', reason },
					{ headers: secret ? { 'x-internal-secret': secret } : {} }
				);
				logInfo('guildBanAdd: posted ban incident to dashboard', { guild: guild.id, user: user?.id });
			}
		} catch (err) {
			logError('guildBanAdd: failed to post incident', { error: (err as Error)?.message ?? err });
		}
	})();

	let data;
	try {
		data = await ChanLogger.findOne({ Guild: guild.id });
	} catch (err) {
		logError('guildBanAdd: failed to read LogsChannelDB', { error: (err as Error)?.message ?? err });
		return;
	}

	if (!data || data?.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	let logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ) logsChannelOBJ = (await guild.channels.fetch(logsChannelID).catch(() => undefined)) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	const embed = new EmbedBuilder()
		.setColor('Red')
		.setTitle(`${guild.name}'s Logs | User Banned`)
		.setDescription(`\`${user?.globalName ?? user?.username ?? 'Unknown'}\` (${user?.id ?? 'Unknown'}) has been banned from the server`)
		.setTimestamp();

	try {
		await logsChannelOBJ.send({ embeds: [embed] });
		logInfo('guildBanAdd: sent ban log', { guild: guild.id, user: user?.id });
	} catch (error) {
		logError('guildBanAdd: failed to send embed', { error: (error as Error)?.message ?? error });
	}
});