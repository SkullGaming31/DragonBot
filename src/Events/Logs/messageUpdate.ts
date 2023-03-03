import { ChannelType, Colors, EmbedBuilder, Message, PartialMessage } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
import DB from '../../Structures/Schemas/LogsChannelDB';// DB

export default new Event('messageUpdate', async (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
	if (!oldMessage.inGuild()) return;
	if (!newMessage.inGuild()) return;
	const { author, channel, guild } = newMessage;
	if (author?.bot) return;

	const data = await DB.findOne({ Guild: guild.id }).catch((err) => { console.error(err); });

	if (!data) return;
	if (data.enableLogs === false) return;
	if (!data) return;

	const logsChannel = data.Channel;
	const Channel = guild.channels.cache.get(logsChannel);
	if (!Channel) return;

	if (oldMessage.content === newMessage.content) return;

	const Count = 1950;

	const Original = oldMessage.content.slice(0, Count) + (oldMessage.content.length > Count ? ' ...' : '');
	const Edited = newMessage.content?.slice(0, Count) + (newMessage.content.length > Count ? ' ...' : '');

	const log = new EmbedBuilder()
		.setColor(Colors.Yellow)
		.setDescription(`📘 A [message](${newMessage.url} by ${author} was **edited** in ${channel}.\n
				**Original**:\n ${Original} \n**Edited**: \n ${Edited}`)
		.setFooter({ text: `Member: ${author?.tag} | ID: ${author?.id}` });

	if (Channel.type === ChannelType.GuildText) return Channel.send({ embeds: [log] });
});