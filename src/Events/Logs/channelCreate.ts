import { ChannelType, Colors, EmbedBuilder, GuildChannel } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
import DB from '../../Structures/Schemas/LogsChannelDB';// DB

export default new Event('channelCreate', async (channel: GuildChannel) => {
	const { guild, name } = channel;

	const data = await DB.findOne({ Guild: guild.id }).catch((err) => { console.error(err); });

	if (!data) return;
	if (data.enableLogs === false) return;
	if (!data) return;

	const logsChannel = data.Channel;
	const Channel = guild.channels.cache.get(logsChannel);
	if (!Channel) return;

	if (Channel.type === ChannelType.GuildText)
		return Channel.send({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Red)
					.setDescription(`a channel has been created named: ${channel}, **${name}**`)
					.setTimestamp()
			]
		});
});