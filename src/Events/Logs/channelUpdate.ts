import { ChannelType, Colors, DMChannel, EmbedBuilder, GuildChannel } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
import DB from '../../Structures/Schemas/LogsChannelDB';// DB

export default new Event('channelUpdate', async (oldChannel: DMChannel | GuildChannel, newChannel: DMChannel | GuildChannel) => {
	// if (newChannel.isDMBased()) return;
	// const { guild, name } = newChannel;

	// const data = await DB.findOne({ Guild: guild.id }).catch((err) => { console.error(err); });

	// if (!data) return;
	// if (data.enableLogs === false) return;
	// if (!data) return;

	// const logsChannel = data.Channel;
	// const Channel = guild.channels.cache.get(logsChannel);
	// if (!Channel) return;

	// if (Channel.type === ChannelType.GuildText)
	//   if (oldChannel.topic !== newChannel.topic) {
	//     return Channel.send({
	//       embeds: [
	//         new EmbedBuilder()
	//           .setColor(Colors.Red)
	//           .setTitle(`${guild.name} | Topic Updated`)
	//           .setDescription(`${newChannel}'s Topic has been changed from \`${oldChannel.topic}\` to \`${newChannel.topic}\``)
	//           .setTimestamp()
	//       ]
	//     });
	//   }
});