import { ChannelType, EmbedBuilder, TextBasedChannel, channelMention } from 'discord.js';

import settings from '../../Database/Schemas/settingsDB';
import { Event } from '../../Structures/Event';
import { error as logError, info as logInfo } from '../../Utilities/logger';

export default new Event<'guildMemberAdd'>('guildMemberAdd', async (member) => {
	const guild = member.guild;
	const user = member.user ?? undefined;
	if (!guild) return;

	let data;
	try {
		data = await settings.findOne({ GuildID: guild.id });
	} catch (err) {
		logError('guildMemberAdd: failed to read settingsDB', { error: (err as Error)?.message ?? err });
		return;
	}

	if (!data || data?.WelcomeChannel === undefined) return;

	let logsChannelOBJ = guild.channels.cache.get(data.WelcomeChannel) as TextBasedChannel | undefined;
	if (!logsChannelOBJ) logsChannelOBJ = (await guild.channels.fetch(data.WelcomeChannel).catch(() => undefined)) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	const rulesChannel = channelMention(guild.rulesChannelId || '');
	const messageToSend = guild.rulesChannel ? `Welcome to ${guild.name}'s server! Please read the rules in ${rulesChannel}. dont forget to pop into the introduction channel and introduce yourself to everyone` : `Welcome to ${guild.name}'s server!`;

	const embed = new EmbedBuilder()
		.setTitle('New Member')
		.setDescription(messageToSend)
		.setAuthor({ name: `${user?.globalName ?? 'Unknown'}`, iconURL: user?.displayAvatarURL({ size: 512 }) })
		.setColor('Blue')
		.addFields([
			{
				name: 'Account Created: ',
				value: `<t:${Math.floor((user?.createdTimestamp ?? Date.now()) / 1000)}:R>`,
				inline: true,
			},
			{
				name: 'Latest Member Count: ',
				value: `${guild.memberCount}`,
				inline: true,
			},
		])
		.setFooter({ text: `UserID: ${member.id}` })
		.setTimestamp();

	const icon = guild.iconURL({ size: 512 });
	if (typeof icon === 'string') embed.setThumbnail(icon);

	try {
		if (data.Welcome === true && logsChannelOBJ) {
			// Keep historical auto-role logic intact (legacy behavior)
			try {
				if (guild.id === '819180459950473236') {
					const memberRole = guild.roles.cache.get('879461309870125147');
					if (memberRole) guild.members.addRole({ user: member, role: memberRole, reason: 'Auto Role Assign' });
				}
			} catch (err) {
				logError('guildMemberAdd: auto-role failed', { error: (err as Error)?.message ?? err });
			}

			await logsChannelOBJ.send({ content: `Welcome ${member}`, embeds: [embed] });
			logInfo('guildMemberAdd: sent welcome message', { guild: guild.id, user: user?.id });
		}
	} catch (error) {
		logError('guildMemberAdd: failed to send welcome embed', { error: (error as Error)?.message ?? error });
	}
});