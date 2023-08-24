import { ChannelType, EmbedBuilder, GuildEmoji, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import { Event } from '../../../src/Structures/Event';
import ChanLogger from '../../Database/Schemas/LogsChannelDB';

export default new Event<'emojiDelete'>('emojiDelete', async (emoji: GuildEmoji) => {
	const { id, guild } = emoji;

	const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => { console.error(err.message); });
	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	const embed = new EmbedBuilder()
		.setColor('Red')
		.setTitle('Emoji Deleted')
		.setDescription(`An emoji has been removed from the server: ${emoji}, \`${id}\``)
		.setTimestamp();

	await logsChannelOBJ.send({ embeds: [embed] });
});