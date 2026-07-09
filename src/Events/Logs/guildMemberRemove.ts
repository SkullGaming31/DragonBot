import { AuditLogEvent, ChannelType, EmbedBuilder, TextBasedChannel } from 'discord.js';
import axios from 'axios';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import settings from '../../Database/Schemas/settingsDB';
import { Event } from '../../Structures/Event';
import { error as logError, info as logInfo } from '../../Utilities/logger';

export default new Event<'guildMemberRemove'>('guildMemberRemove', async (member) => {
	const guild = member.guild;
	const user = member.user ?? undefined;
	if (!guild) return;

	// Detect kicks via audit log (Discord has no dedicated kick event).
	// guildBanAdd handles bans separately, so we skip those here.
	void (async () => {
		try {
			const url = process.env.AUTOMOD_DASHBOARD_URL;
			const secret = process.env.INTERNAL_SECRET;
			if (!url || !user) return;

			// Fetch recent kick audit log entries — requires VIEW_AUDIT_LOG permission.
			const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 5 }).catch(() => null);
			if (!logs) return;

			const FIVE_SECONDS = 5_000;
			const entry = logs.entries.find(
				e => e.target?.id === user.id && (Date.now() - e.createdTimestamp) < FIVE_SECONDS
			);
			if (!entry) return; // not a kick — voluntary leave or ban (handled by guildBanAdd)

			const executor = entry.executor;
			await axios.post(
				`${url.replace(/\/$/, '')}/api/v1/automod/${guild.id}/incidents`,
				{
					userId: user.id,
					userDisplayName: user.globalName ?? user.username ?? user.tag,
					actorId: executor?.id,
					action: 'kick',
					reason: entry.reason ?? 'No reason provided',
				},
				{ headers: secret ? { 'x-internal-secret': secret } : {} }
			);
			logInfo('guildMemberRemove: posted kick incident to dashboard', { guild: guild.id, user: user.id, executor: executor?.id });
		} catch (err) {
			logError('guildMemberRemove: failed to post kick incident', { error: (err as Error)?.message ?? err });
		}
	})();

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