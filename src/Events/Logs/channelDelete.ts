import { ChannelType, Colors, DMChannel, EmbedBuilder, GuildChannel } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
// import ChanLogger from '../../Structures/Schemas/LogsChannelDB';// DB
// import GenLogs from '../../Structures/Schemas/GeneralLogsDB'; //SwitchDB

export default new Event('channelDelete', async (channel: GuildChannel | DMChannel) => {
	if (channel.isDMBased()) return;
	const { guild, name } = channel;

	const logsChannel = '765920602287636481';
	const Channel = guild.channels.cache.get(logsChannel);
	if (!Channel) return;

	if (Channel.type === ChannelType.GuildText)
		return Channel.send({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Red)
					.setDescription(`a channel has been Deleted Named: ${channel}, **${name}**`)
					.setTimestamp()
			]
		});
});