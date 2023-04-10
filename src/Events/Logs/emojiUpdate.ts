import { ChannelType, EmbedBuilder, GuildEmoji, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import { Event } from '../../../src/Structures/Event';
import ChanLogger from '../../Structures/Schemas/LogsChannelDB';

export default new Event<'emojiUpdate'>('emojiUpdate', async (oldEmoji: GuildEmoji, newEmoji: GuildEmoji) => {
	const { id, client, guild } = newEmoji;

	const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => { console.error(err.message); });
	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelOBJ = client.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;

	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	const embed = new EmbedBuilder()
		.setColor('Green')
		.setTitle('Emoji Created')
		.setDescription(`An emoji has been updated in the server: ${newEmoji.name}`)
		.setFooter({ text: `EmojiID: ${id}` })
		.setTimestamp();

	try {
		await logsChannelOBJ.send({ embeds: [embed] });
	} catch (error) {
		console.error(error);
	}
});
