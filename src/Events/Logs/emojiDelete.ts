import { ChannelType, Colors, EmbedBuilder, Emoji } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
// import ChanLogger from '../../Structures/Schemas/LogsChannelDB';// DB
// import GenLogs from '../../Structures/Schemas/GeneralLogsDB'; //SwitchDB

export default new Event('emojiDelete', async (emoji: Emoji) => {
	const { id, client } = emoji;

	const logsChannel = '959693430647308295';
	const Channel = client.channels.cache.get(logsChannel);
	if (!Channel) return;

	if (Channel.type === ChannelType.GuildText)
		return Channel.send({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Red)
					.setTitle('Emoji Deleted')
					.setDescription(`an emoji has been removed from the server: ${emoji}, \`${id}\``)
					.setTimestamp()
			]
		});
});