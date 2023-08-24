import { ChannelType, EmbedBuilder, ErrorEvent, Message, PartialMessage, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import { Event } from '../../../src/Structures/Event';
import ChanLogger from '../../Database/Schemas/LogsChannelDB'; // DB

export default new Event<'messageDelete'>('messageDelete', async (message: Message | PartialMessage) => {
	if (!message.inGuild()) return;

	const { guild, author, channel } = message;
	const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => { console.error(err.message); });

	if (!data || data?.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	const logsEmbed = new EmbedBuilder()
		.setTitle('Automated Message Deletion')
		.setAuthor({ name: author?.tag ?? 'Thread Message Deleted'})
		.setColor('Red')
		.addFields([
			{ name: 'User', value: author?.username ?? 'Unknown' },
			{ name: '🚨 | Deleted Message: ', value: `${message.content ?? 'None'}`.slice(0, 4096) },
			{ name: 'Channel', value: `${channel}` },
		])
		.setURL(`${message.url}`)
		.setFooter({ text: `UserID: ${author?.id ?? 'Unknown'}` })
		.setTimestamp();

	if (message.attachments.size >= 1) {
		logsEmbed.addFields({ name: 'Attachments:', value: `${message.attachments.map((a) => a.url)}`, inline: true });
	}

	try {
		await logsChannelOBJ.send({ embeds: [logsEmbed] }).catch((err: ErrorEvent) => { console.error(err.type + ':' + err.message); });
	} catch (err) {
		console.error(err);
	}
});