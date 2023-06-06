import { ChannelType, EmbedBuilder, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import { Event } from '../../../src/Structures/Event';
import settings from '../../Structures/Schemas/settingsDB';

export default new Event<'guildMemberRemove'>('guildMemberRemove', async (member) => {
	try {
		const { guild, user } = member;

		const data = await settings.findOne({ GuildID: guild.id }).catch((err: MongooseError) => { console.error(err.message); });
		if (data?.WelcomeChannel === undefined) return;
		const logsChannelOBJ = guild.channels.cache.get(data.WelcomeChannel) as TextBasedChannel | undefined;
		if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

		if (member.joinedTimestamp === null) return;

		const embed = new EmbedBuilder()
			.setTitle('Member Left')
			.setAuthor({ name: user.tag, iconURL: user.displayAvatarURL({ size: 512 })})
			.setColor('Red')
			.addFields([
				{
					name: 'Joined: ',
					value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
					inline: false
				}
			])
			.setFooter({ text: `UserID: ${member.id}`})
			.setTimestamp();

		if (data.Welcome === true) await logsChannelOBJ.send({ embeds: [embed] });
	} catch (error) { console.error(error); }
});