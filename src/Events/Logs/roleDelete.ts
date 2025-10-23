 
import { ChannelType, EmbedBuilder, Role, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB'; // DB
import { Event } from '../../Structures/Event';
import { error as logError, info, warn } from '../../Utilities/logger';


export default new Event<'roleDelete'>('roleDelete', async (role: Role) => {
	const { guild, id, name } = role;

	let data;
	try {
		data = await ChanLogger.findOne({ Guild: guild.id });
	} catch (err) {
		logError('roleDelete: failed to read ChanLogger', { err: (err as MongooseError).message });
		return;
	}

	if (!data || !data.enableLogs) return;

	const logsChannelID = data.Channel;
	if (!logsChannelID) return;

	let logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ) {
		try {
			const fetched = await guild.channels.fetch(logsChannelID).catch(() => undefined);
			logsChannelOBJ = fetched as TextBasedChannel | undefined;
		} catch (_err) {
			logError('roleDelete: failed to fetch logs channel', { err: String(_err) });
			return;
		}
	}

	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) {
		warn('roleDelete: logs channel invalid or not a text channel', { guildId: guild.id, logsChannelID });
		return;
	}

	const embed = new EmbedBuilder()
		.setColor('Red')
		.setTitle(`${guild.name} | Role Deleted`)
		.addFields(
			{ name: 'Name', value: name ?? 'unknown', inline: true },
			{ name: 'ID', value: id, inline: true }
		)
		.setTimestamp();

	try {



		const possibleSender = logsChannelOBJ as unknown as { send?: (..._args: unknown[]) => Promise<unknown> } | undefined;
		if (possibleSender && typeof possibleSender.send === 'function') {
			await possibleSender.send({ embeds: [embed] });
			info('roleDelete: logged role delete', { guildId: guild.id, roleId: id });
		}
	} catch (err) {
		logError('roleDelete: failed to send log message', { err: String(err), guildId: guild.id, roleId: id });
	}
});