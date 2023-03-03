import { ChannelType, Colors, EmbedBuilder, Emoji } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
// import DB from '../../Structures/Schemas/LogsChannelDB';// DB

export default new Event('emojiCreate', async (emoji: Emoji) => {
	const { id, client } = emoji;

	const g = await emoji.client.guilds.fetch();
	console.log('Guild Count: ' + g.size);

	const logsChannel = '959693430647308295';
	const Channel = client.channels.cache.get(logsChannel);
	if (!Channel) return;

	if (Channel.type === ChannelType.GuildText)
		return Channel.send({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Green)
					.setTitle('Emoji Created')
					.setDescription(`an emoji has been added to the server: ${emoji}, \`${id}\``)
					.setTimestamp()
			]
		});
});