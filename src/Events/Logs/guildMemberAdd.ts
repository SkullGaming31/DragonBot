import { ChannelType, EmbedBuilder, TextBasedChannel, channelMention } from 'discord.js';
import { MongooseError } from 'mongoose';

import settings from '../../Database/Schemas/settingsDB';
import { Event } from '../../Structures/Event';

export default new Event<'guildMemberAdd'>('guildMemberAdd', async (member) => {
	const { guild, user } = member;

	const data = await settings.findOne({ GuildID: guild.id }).catch((err: MongooseError) => { console.error(err.message); });
	if (data?.WelcomeChannel === undefined) return;
	const logsChannelOBJ = guild.channels.cache.get(data.WelcomeChannel) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	// let messageToSend: string;
	// if (guild.rulesChannel) {
	// 	messageToSend = `Welcome to ${guild.name}'s server! Please read the rules in <#${guild.rulesChannelId}>.`;
	// } else {
	// 	messageToSend = `Welcome to ${guild.name}'s server!`;
	// }

	const rulesChannel = channelMention(guild.rulesChannelId || '');
	const messageToSend = guild.rulesChannel ? `Welcome to ${guild.name}'s server! Please read the rules in ${rulesChannel}.` : `Welcome to ${guild.name}'s server!`;

	const embed = new EmbedBuilder()
		.setTitle('New Member')
		.setDescription(messageToSend)
		.setAuthor({ name: `${user.globalName}`, iconURL: user.displayAvatarURL({ size: 512 }) })
		.setColor('Blue')
		.addFields([
			{
				name: 'Account Created: ',
				value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
				inline: true,
			},
			{
				name: 'Latest Member Count: ',
				value: `${guild.memberCount}`,
				inline: true,
			},
		])
		.setThumbnail(guild.iconURL({ size: 512 }))
		.setFooter({ text: `UserID: ${member.id}` })
		.setTimestamp();
	try {
		if (data.Welcome === true) {
			switch (guild.id) {
				case '819180459950473236':
					// eslint-disable-next-line no-case-declarations
					const memberRole = guild.roles.cache.get('879461309870125147');
					if (memberRole) guild.members.addRole({ user: member, role: memberRole, reason: 'Auto Role Assign' });
					break;
			}
			if (guild.id === '819180459950473236') {
				const memberRole = guild.roles.cache.get('879461309870125147');
				if (memberRole) {
					guild.members.addRole({ user: member, role: memberRole, reason: 'Auto Role Assign' });
				} else {
					console.error(`Error finding Role ${memberRole}`);
				}
			}
			await logsChannelOBJ.send({ content: `Welcome ${member}`, embeds: [embed] });
		}
	} catch (error) {
		console.error(error);
	}
});