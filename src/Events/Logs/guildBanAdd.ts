import { ChannelType, Colors, EmbedBuilder, GuildBan } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
import DB from '../../Structures/Schemas/LogsChannelDB';// DB

export default new Event('guildBanAdd', async (ban: GuildBan) => {
	const { guild, user } = ban;

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
					.setTitle(`${guild.name}'s Logs | User Banned`)
					.setDescription(`\`${user.username}#${user.discriminator}\`(${user.id}) has been banned from the server`)
					.setTimestamp()
			]
		});
});