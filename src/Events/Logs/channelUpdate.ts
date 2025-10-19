
import { ChannelType, EmbedBuilder, TextChannel, DMChannel, GuildChannel } from 'discord.js';
import { MongooseError } from 'mongoose';
import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';
import { error as logError, info } from '../../Utilities/logger';

export default new Event<'channelUpdate'>('channelUpdate', async (oldChannel: DMChannel | GuildChannel, newChannel: DMChannel | GuildChannel) => {
	if (newChannel.isDMBased()) return;

	let data;
	try {
		data = await ChanLogger.findOne({ Guild: newChannel.guildId });
	} catch (err) {
		logError('channelUpdate: failed to read ChanLogger', { err: (err as MongooseError).message });
		return;
	}

	if (!data || data.enableLogs === false) return;

	const logsChannelID = data.Channel;
	if (!logsChannelID) return;

	let logsChannelOBJ = newChannel.guild.channels.cache.get(logsChannelID);
	if (!logsChannelOBJ) {
		try {
			const fetched = await newChannel.guild.channels.fetch(logsChannelID).catch(() => undefined);
			logsChannelOBJ = fetched ?? undefined;
		} catch (err) {
			logError('channelUpdate: failed to fetch logs channel', { err: String(err) });
			return;
		}
	}

	if (!logsChannelOBJ || oldChannel.type !== ChannelType.GuildText || newChannel.type !== ChannelType.GuildText) return;
	const oldTextChannel = oldChannel as TextChannel;
	const newTextChannel = newChannel as TextChannel;

	if (oldTextChannel.topic !== newTextChannel.topic) {
		const embed = new EmbedBuilder()
			.setColor('Red')
			.setTitle(`${newTextChannel.guild.name} | Topic Updated`)
			.addFields(
				{ name: 'Channel', value: `<#${newTextChannel.id}>`, inline: true },
				{ name: 'Old', value: oldTextChannel.topic ?? 'N/A', inline: true },
				{ name: 'New', value: newTextChannel.topic ?? 'N/A', inline: true }
			)
			.setTimestamp();

		try {
			await (logsChannelOBJ as TextChannel).send({ embeds: [embed] });
			info('channelUpdate: logged topic change', { guildId: newTextChannel.guildId, channelId: newTextChannel.id });
		} catch (err) {
			logError('channelUpdate: failed to send log message', { err: String(err) });
		}
	}
});