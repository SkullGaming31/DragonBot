import { ChannelType, EmbedBuilder, ErrorEvent, Message, PartialMessage, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB'; // DB
import { Event } from '../../Structures/Event';

export default new Event<'messageDelete'>('messageDelete', async (message: Message | PartialMessage) => {
	if (!message.guild) return;

	const { guild, author, channel } = message;
	const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => { console.error(err.message); });

	if (!data || data?.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText || channel.type !== ChannelType.PublicThread) return;
	if (channel.id === data.Channel) return;

	// Get the message content or use 'None' if it's empty or undefined
	const messageContent = (message as Message | PartialMessage).content || 'None';

	// Get the author's name (including discriminator for users, tag for bots)
	const authorName = author?.bot ? author.tag : author?.globalName || 'Unknown';

	// Truncate the message content to fit within Discord's embed field limit
	const truncatedContent = messageContent.slice(0, 1024); // Truncate to 1024 characters

	const logsEmbed = new EmbedBuilder()
		.setTitle('Automated Message Deletion')
		.setAuthor({ name: authorName })
		.setColor('Red')
		.addFields([
			{ name: 'User', value: authorName },
			{ name: '🚨 | Deleted Message: ', value: truncatedContent },
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