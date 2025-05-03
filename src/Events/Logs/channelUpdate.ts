 
import { ChannelType, DMChannel, EmbedBuilder, GuildChannel, TextChannel } from 'discord.js';
import { MongooseError } from 'mongoose';
import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';

export default new Event<'channelUpdate'>('channelUpdate', async (oldChannel: DMChannel | GuildChannel, newChannel: DMChannel | GuildChannel) => {
	if (newChannel.isDMBased()) return;

	const data = await ChanLogger.findOne({ Guild: newChannel.guildId }).catch((err: MongooseError) => { console.error(err.message); });

	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelOBJ = newChannel.guild.channels.cache.get(logsChannelID);

	if (!logsChannelOBJ || oldChannel.type !== ChannelType.GuildText || newChannel.type !== ChannelType.GuildText) return;
	const oldTextChannel = oldChannel as TextChannel;
	const newTextChannel = newChannel as TextChannel;

	// Check if both oldChannel and newChannel have a topic property before comparing
	if (oldTextChannel.topic !== newTextChannel.topic) {
		const embed = new EmbedBuilder()
			.setColor('Red')
			.setTitle(`${newTextChannel.guild.name} | Topic Updated`)
			.setDescription(`${newTextChannel} topic has been changed from \`${oldTextChannel.topic || 'N/A'}\` to \`${newTextChannel.topic || 'N/A'}\``)
			.setTimestamp();

		return await (logsChannelOBJ as TextChannel).send({ embeds: [embed] });
	}
	return;
});