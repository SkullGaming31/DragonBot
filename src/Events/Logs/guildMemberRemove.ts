import { ChannelType, EmbedBuilder, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import logger from '../../Database/Schemas/LogsChannelDB';
import settings from '../../Database/Schemas/settingsDB';
import { Event } from '../../Structures/Event';

export default new Event<'guildMemberRemove'>('guildMemberRemove', async (member) => {
	try {
		const { guild, user } = member;

		const data = await settings.findOne({ GuildID: guild.id }).catch((err: MongooseError) => { console.error(err.message); });
		const DB = await logger.findOne({ Guild: guild.id }).catch((err: MongooseError) => { console.error(err.message); });
		if (data?.WelcomeChannel === undefined || DB?.Channel === undefined) return;
		const logsChannelOBJ = guild.channels.cache.get(DB?.Channel) as TextBasedChannel | undefined;
		if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

		if (member.joinedTimestamp === null) return;

		const embed = new EmbedBuilder()
			.setTitle('Member Left')
			.setAuthor({ name: `${user.globalName}`, iconURL: user.displayAvatarURL({ size: 512 }) })
			.setColor('Red')
			.addFields([
				{
					name: 'Joined: ',
					value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
					inline: false
				}
			])
			.setFooter({ text: `UserID: ${member.id}` })
			.setTimestamp();

		if (data.Welcome === true) await logsChannelOBJ.send({ embeds: [embed] });
	} catch (error) { console.error(error); }
});