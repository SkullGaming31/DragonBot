import { ChannelType, EmbedBuilder, GuildEmoji, TextBasedChannel } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
import ChanLogger from '../../Structures/Schemas/LogsChannelDB';
import { MongooseError } from 'mongoose';

export default new Event<'emojiCreate'>('emojiCreate', async (emoji: GuildEmoji) => {
	const { id, client, guild } = emoji;

	const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => { console.error(err.message); });
	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelOBJ = client.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;

	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	const embed = new EmbedBuilder()
		.setColor('Green')
		.setTitle('Emoji Created')
		.setDescription(`An emoji has been added to the server: ${emoji}, \`${id}\``)
		.setTimestamp();

	await logsChannelOBJ.send({ embeds: [embed] });
});
