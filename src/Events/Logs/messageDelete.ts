import { ChannelType, Colors, EmbedBuilder, Message, PartialMessage } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
// import ChanLogger from '../../Structures/Schemas/LogsChannelDB';// DB
// import GenLogs from '../../Structures/Schemas/GeneralLogsDB'; //SwitchDB

export default new Event('messageDelete', async (message: Message | PartialMessage) => {
	const { guild, author } = message;

	const logsChannel = '959693430647308295';
	const Channel = guild?.channels.cache.get(logsChannel);
	if (!Channel) return;

	const logsEmbed = new EmbedBuilder()
		.setTitle('Automated Message Deletion')
		.setAuthor({ name: `${message.author?.tag || 'No User Detected'}` })
		.setColor(Colors.Red)
		.addFields([
			{ name: 'User', value: `${author?.username}` },
			{ name: '🚨 | Deleted Message: ', value: `\`${message.content ? message.content : 'None'}\``.slice(0, 4096) },
			{ name: 'Channel', value: `${message.channel}` }
		])
		.setURL(`${message.url}`)
		.setFooter({ text: `UserID: ${author?.id}` })
		.setTimestamp();

	if (message.attachments.size >= 1) {
		logsEmbed.addFields({ name: 'Attachments:', value: `${message.attachments.map((a) => a.url)}`, inline: true });
	}

	if (Channel.type === ChannelType.GuildText)
		return Channel.send({ embeds: [logsEmbed] });
});