import { ChannelType, EmbedBuilder, Guild, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';

export default new Event<'guildCreate'>('guildCreate', async (guild: Guild) => {
	try {
		const { channels } = guild;

		const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => { console.error(err.message); });
		if (!data || data.enableLogs === false) return;

		const logsChannelID = data.Channel;
		if (logsChannelID === undefined) return;
		const logsChannelOBJ = channels.cache.get('1207907317190885376') as TextBasedChannel | undefined;
		if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

		const guildOwner = await guild.fetchOwner();
		const bans = await guild.bans.fetch({ cache: true, limit: 20 });

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
			.setAuthor({ name: guildOwner.displayName, iconURL: guildOwner.displayAvatarURL({ size: 512 }) })
			.setImage(guild.bannerURL({ size: 512 }))
			.setColor('Green')
			.setDescription('The bot has joined a guild!')
			.addFields([
				{ name: 'Guild Description', value: guild.description || 'No Description set', inline: false },
				{ name: 'Guild Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: false },
				{ name: 'Member Count', value: guild.memberCount.toString(), inline: false },
				{ name: 'NSFW', value: guild.explicitContentFilter.toString(), inline: false },
				{ name: 'Ban Count', value: bans.size.toString() || '0', inline: false },
				{ name: 'defaultMessageNotifications', value: notificationSetting, inline: false },
				{ name: 'Verification Level', value: guild.verificationLevel.toString(), inline: false },
			])
			.setTimestamp();

		await logsChannelOBJ.send({ embeds: [embed] });
	} catch (error) {
		console.error(error);
	}
});