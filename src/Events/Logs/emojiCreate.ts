import { ChannelType, EmbedBuilder, GuildEmoji, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';
import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';
import { error as logError, info, warn } from '../../Utilities/logger';

export default new Event<'emojiCreate'>('emojiCreate', async (emoji: GuildEmoji) => {
	const { id, client, guild, name } = emoji;

	let data;
	try {
		data = await ChanLogger.findOne({ Guild: guild.id });
	} catch (err) {
		logError('emojiCreate: failed to read ChanLogger', { err: (err as MongooseError).message });
		return;
	}

	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (!logsChannelID) return;

	let logsChannelOBJ = client.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ) {
		try {
			const fetched = await guild.channels.fetch(logsChannelID).catch(() => undefined);
			logsChannelOBJ = fetched as TextBasedChannel | undefined;
		} catch (err) {
			logError('emojiCreate: failed to fetch logs channel', { err: String(err) });
			return;
		}
	}

	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) {
		warn('emojiCreate: logs channel invalid or not a text channel', { guildId: guild.id, logsChannelID });
		return;
	}

	const embed = new EmbedBuilder()
		.setColor('Green')
		.setTitle('Emoji Created')
		.addFields(
			{ name: 'Name', value: name ?? 'unknown', inline: true },
			{ name: 'ID', value: id, inline: true }
		)
		.setTimestamp();

	try {
		await logsChannelOBJ.send({ embeds: [embed] });
		info('emojiCreate: logged emoji create', { guildId: guild.id, emojiId: id });
	} catch (err) {
		logError('emojiCreate: failed to send log message', { err: String(err), guildId: guild.id, emojiId: id });
	}
});
