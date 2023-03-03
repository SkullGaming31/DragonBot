import { ChannelType, Colors, EmbedBuilder, Role } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
import DB from '../../Structures/Schemas/LogsChannelDB';// DB

export default new Event('roleCreate', async (role: Role) => {
	const { guild, name } = role;

	const data = await DB.findOne({ Guild: guild.id }).catch((err) => { console.error(err); });

	if (!data) return;
	if (data.enableLogs === false) return;
	if (!data) return;

	const logsChannel = data.Channel;
	const Channel = guild.channels.cache.get(logsChannel);
	if (!Channel) return;

	const Embed = new EmbedBuilder()
		.setColor(Colors.Red)
		.setTimestamp();

	if (Channel.type === ChannelType.GuildText)
		return Channel.send({
			embeds: [
				Embed.setTitle(`${process.env.Settings} | Role Created`),
				Embed.setDescription(`a role has been created named: ${role}, \`${name}\``)
			]
		});
});