import { ChannelType, EmbedBuilder, TextBasedChannel } from 'discord.js';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import settings from '../../Database/Schemas/settingsDB';
import { Event } from '../../Structures/Event';
import { error as logError, info as logInfo } from '../../Utilities/logger';

export default new Event<'guildMemberRemove'>('guildMemberRemove', async (member) => {
	const guild = member.guild;
	const user = member.user ?? undefined;
	if (!guild) return;

	let data;
	try {
		data = await settings.findOne({ GuildID: guild.id });
	} catch (err) {
		logError('guildMemberRemove: failed to read settingsDB', { error: (err as Error)?.message ?? err });
		return;
	}

	let DB;
	try {
		DB = await ChanLogger.findOne({ Guild: guild.id });
	} catch (err) {
		logError('guildMemberRemove: failed to read LogsChannelDB', { error: (err as Error)?.message ?? err });
		return;
	}

	if (data?.WelcomeChannel === undefined || DB?.Channel === undefined) return;
	let logsChannelOBJ = guild.channels.cache.get(DB?.Channel) as TextBasedChannel | undefined;
	if (!logsChannelOBJ) logsChannelOBJ = (await guild.channels.fetch(DB?.Channel).catch(() => undefined)) as TextBasedChannel | undefined;
	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	if (member.joinedTimestamp === null) return;

	const embed = new EmbedBuilder()
		.setTitle('Member Left')
		.setAuthor({ name: `${user?.globalName ?? 'Unknown'}`, iconURL: user?.displayAvatarURL({ size: 512 }) })
		.setColor('Red')
		.addFields([
			{
				name: 'Joined: ',
				value: `<t:${Math.floor((member.joinedTimestamp ?? Date.now()) / 1000)}:R>`,
				inline: false
			}
		])
		.setFooter({ text: `UserID: ${member.id}` })
		.setTimestamp();

	try {
		if (data.Welcome === true) {
			await logsChannelOBJ.send({ embeds: [embed] });
			logInfo('guildMemberRemove: sent leave log', { guild: guild.id, user: user?.id });
		}
	} catch (error) {
		logError('guildMemberRemove: failed to send embed', { error: (error as Error)?.message ?? error });
	}
});