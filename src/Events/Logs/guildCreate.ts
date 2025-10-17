import { ChannelType, EmbedBuilder, Guild, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';
import { error as logError, info as logInfo } from '../../Utilities/logger';

export default new Event<'guildCreate'>('guildCreate', async (guild: Guild) => {
	try {
		const { channels } = guild;

		let data;
		try {
			data = await ChanLogger.findOne({ Guild: guild.id });
		} catch (err) {
			logError('guildCreate: failed to read LogsChannelDB', { error: (err as Error)?.message ?? err });
			return;
		}
		if (!data || data.enableLogs === false) return;

		const logsChannelID = data.Channel;
		if (logsChannelID === undefined) return;
		let logsChannelOBJ = channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
		if (!logsChannelOBJ) logsChannelOBJ = (await channels.fetch(logsChannelID).catch(() => undefined)) as TextBasedChannel | undefined;
		if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

		const guildOwner = await guild.fetchOwner().catch(() => undefined);
		const bans = await guild.bans.fetch({ cache: true, limit: 20 }).catch(() => new Map());

		let notificationSetting: string;
		switch (guild.defaultMessageNotifications) {
			case 0:
				notificationSetting = 'All Messages';
				break;
			case 1:
				notificationSetting = 'Only @Mentions';
				break;
			default:
				notificationSetting = guild.defaultMessageNotifications.toString();
				break;
		}

		const embed = new EmbedBuilder()
			.setTitle(guild.name)
			.setAuthor({ name: guildOwner?.displayName ?? 'Unknown', iconURL: guildOwner?.displayAvatarURL({ size: 512 }) });
		const banner = guild.bannerURL({ size: 512 });
		if (typeof banner === 'string') embed.setImage(banner);

		embed
			.setColor('Green')
			.setDescription('The bot has joined a guild!')
			.addFields([
				{ name: 'Guild Description', value: guild.description || 'No Description set', inline: false },
				{ name: 'Guild Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: false },
				{ name: 'Member Count', value: guild.memberCount.toString(), inline: false },
				{ name: 'NSFW', value: String(guild.explicitContentFilter), inline: false },
				{ name: 'Ban Count', value: String(bans?.size ?? 0) || '0', inline: false },
				{ name: 'defaultMessageNotifications', value: notificationSetting, inline: false },
				{ name: 'Verification Level', value: guild.verificationLevel.toString(), inline: false },
			])
			.setTimestamp();

		await logsChannelOBJ.send({ embeds: [embed] });
		logInfo('guildCreate: sent guild create log', { guild: guild.id });
	} catch (error) {
		logError('guildCreate: unexpected error', { error: (error as Error)?.message ?? error });
	}
});