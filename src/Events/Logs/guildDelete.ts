import { ChannelType, EmbedBuilder, Guild, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';
import { error as logError, info as logInfo } from '../../Utilities/logger';

export default new Event<'guildDelete'>('guildDelete', async (guild: Guild) => {
	const { channels } = guild;

	let data;
	try {
		data = await ChanLogger.findOne({ Guild: guild.id });
	} catch (err) {
		logError('guildDelete: failed to read LogsChannelDB', { error: (err as Error)?.message ?? err });
		return;
	}
	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	let logsChannelOBJ = channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ) logsChannelOBJ = (await channels.fetch(logsChannelID).catch(() => undefined)) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	const guildOwner = await guild.fetchOwner().catch(() => undefined);

	const embed = new EmbedBuilder()
		.setTitle(guild.name)
		.setAuthor({ name: guildOwner?.displayName ?? 'Unknown', iconURL: guildOwner?.displayAvatarURL({ size: 512 }) });
	const banner = guild.bannerURL({ size: 512 });
	if (typeof banner === 'string') embed.setImage(banner);

	embed
		.setColor('Red')
		.setDescription(`The bot has left ${guildOwner?.displayName ?? 'a'}'s guild`)
		.setTimestamp();

	try {
		await logsChannelOBJ.send({ embeds: [embed] });
		logInfo('guildDelete: sent guild delete log', { guild: guild.id });
	} catch (error) {
		logError('guildDelete: failed to send embed', { error: (error as Error)?.message ?? error });
	}
});