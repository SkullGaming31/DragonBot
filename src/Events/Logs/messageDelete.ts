import { ChannelType, Colors, EmbedBuilder, Message, PartialMessage } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
import DB from '../../Structures/Schemas/LogsChannelDB';// DB
import SwitchDB from '../../Structures/Schemas/GeneralLogsDB'; //SwitchDB

export default new Event('messageDelete', async (message: Message | PartialMessage) => {
	if (!message.inGuild()) return;
	const { guild, author, channel } = message;

	const data = await DB.findOne({ Guild: guild.id }).catch((err) => { console.error(err); });
	const Data = await SwitchDB.findOne({ Guild: guild.id }).catch((err) => { console.error(err); });

	if (!Data) return;
	if (Data.ChannelStatus === false) return;
	if (!data) return;

	const logsChannel = data.Channel;
	const Channel = guild.channels.cache.get(logsChannel);
	if (!Channel) return;

	const logsEmbed = new EmbedBuilder()
		.setTitle('Automated Message Deletion')
		.setAuthor({ name: `${author?.tag ? author.tag : 'Thread Message Deleted'}` })
		.setColor(Colors.Red)
		.addFields([
			{ name: 'User', value: `${author?.username}` },
			{ name: '🚨 | Deleted Message: ', value: `\`${message.content ? message.content : 'None'}\``.slice(0, 4096) },
			{ name: 'Channel', value: `${channel}` }
		])
		.setURL(`${message.url}`).setFooter({ text: `UserID: ${author?.id}` }).setTimestamp();

	if (message.attachments.size >= 1) {
		logsEmbed.addFields({ name: 'Attachments:', value: `${message.attachments.map((a) => a.url)}`, inline: true });
	}

	if (Channel.type === ChannelType.GuildText)
		return Channel.send({ embeds: [logsEmbed] });
});