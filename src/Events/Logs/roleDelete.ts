import { ChannelType, Colors, EmbedBuilder, Role } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
import DB from '../../Structures/Schemas/LogsChannelDB';// DB
import SwitchDB from '../../Structures/Schemas/GeneralLogsDB'; //SwitchDB

export default new Event('roleDelete', async (role: Role) => {
	const { guild, name } = role;

	const data = await DB.findOne({ Guild: guild.id }).catch((err) => { console.error(err); });
	const Data = await SwitchDB.findOne({ Guild: guild.id }).catch((err) => { console.error(err); });

	if (!Data) return;
	if (Data.ChannelStatus === false) return;
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
				Embed.setTitle(`${guild.name} | Role Deleted`),
				Embed.setDescription(`a role has been Deleted named: ${role}, \`${name}\``)
			]
		});
});