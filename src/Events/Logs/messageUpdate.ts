import { ChannelType, EmbedBuilder, Message, PartialMessage, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB'; // DB
import { Event } from '../../Structures/Event';

export default new Event<'messageUpdate'>('messageUpdate', async (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
	if (!newMessage.inGuild()) return;
	const { author, channel, guild } = newMessage;
	if (author?.bot) return;

	const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => { console.error(err.message); });

	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;
	if (channel.id === data.Channel) return;

	if (oldMessage.content === newMessage.content) return;

	const Count = 1950;

	if (oldMessage.content?.length === undefined) return;
	const Original = oldMessage.content?.slice(0, Count) + (oldMessage.content?.length > Count ? ' ...' : '');
	const Edited = newMessage.content?.slice(0, Count) + (newMessage.content.length > Count ? ' ...' : '');

	const log = new EmbedBuilder()
		.setColor('Yellow')
		.setDescription(`📘 A [message](${newMessage.url} by ${author} was **edited** in ${channel}.\n
				**Original**:\n ${Original} \n**Edited**: \n ${Edited}`)
		.setFooter({ text: `Member: ${author?.globalName} | ID: ${author?.id}` });

	try {
		await logsChannelOBJ.send({ embeds: [log] });
	} catch (error) {
		console.error(error);
	}
});