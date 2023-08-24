/* eslint-disable @typescript-eslint/no-unused-vars */
import { DMChannel, GuildChannel } from 'discord.js';

import { Event } from '../../../src/Structures/Event';

export default new Event<'channelUpdate'>('channelUpdate', async (oldChannel: DMChannel | GuildChannel, newChannel: DMChannel | GuildChannel) => {
	// if (newChannel.isDMBased()) return;

	// const data = await ChanLogger.findOne({ Guild: newChannel.guildId }).catch((err: MongooseError) => { console.error(err.message); });

	// if (!data || data.enableLogs === false) return;

	// const logsChannelID = data.Channel;
	// if (logsChannelID === undefined) return;
	// const logsChannelOBJ = newChannel.guild.channels.cache.get(logsChannelID);

	// if (!logsChannelOBJ || Channel.type !== ChannelType.GuildText) return;


	// if (oldChannel.topic !== newChannel.topic) {
	// 	const embed = new EmbedBuilder()
	// 		.setColor('Red')
	// 		.setTitle(`${newChannel.guild.name} | Topic Updated`)
	// 		.setDescription(`${newChannel} topic has been changed from \`${oldChannel.topic}\` to \`${newChannel.topic}\``)
	// 		.setTimestamp();

	// 	return await logsChannelOBJ.send({ embeds: [embed] });
	// }
	return;
});