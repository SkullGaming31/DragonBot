import { ChannelType, EmbedBuilder, Guild, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';

export default new Event<'guildDelete'>('guildDelete', async (guild: Guild) => {
	const { channels } = guild;

	const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => { console.error(err.message); });
	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelOBJ = channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	const guildOwner = await guild.fetchOwner();

	const embed = new EmbedBuilder()
		.setTitle(guild.name)
		.setAuthor({ name: guildOwner.displayName, iconURL: guildOwner.displayAvatarURL({ size: 512 }) })
		.setImage(guild.bannerURL({ size: 512 }))
		.setColor('Green')
		.setDescription(`The bot has left ${guildOwner.displayName}'s guild`)
		.setTimestamp();
		
	try {
		await logsChannelOBJ.send({ embeds: [embed] });
	} catch (error) {
		console.error(error);
	}
});