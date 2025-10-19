import { ChannelType, EmbedBuilder, Guild, TextBasedChannel } from 'discord.js';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';
import { error as logError, info as logInfo } from '../../Utilities/logger';

export default new Event<'guildIntegrationsUpdate'>('guildIntegrationsUpdate', async (guild: Guild) => {
	const { channels } = guild;

	let data;
	try {
		data = await ChanLogger.findOne({ Guild: guild.id });
	} catch (err) {
		logError('guildIntegrationsUpdate: failed to read LogsChannelDB', { error: (err as Error)?.message ?? err });
		return;
	}
	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	let logsChannelOBJ = channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ) logsChannelOBJ = (await channels.fetch(logsChannelID).catch(() => undefined)) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	// integrations not implemented; keep placeholder but use structured embed and logger
	const embed = new EmbedBuilder()
		.setTitle(guild.name)
		.setDescription('Integration change detected — details currently not implemented')
		.setTimestamp();

	try {
		await logsChannelOBJ.send({ embeds: [embed] });
		logInfo('guildIntegrationsUpdate: sent integrations update log', { guild: guild.id });
	} catch (error) {
		logError('guildIntegrationsUpdate: failed to send embed', { error: (error as Error)?.message ?? error });
	}
});