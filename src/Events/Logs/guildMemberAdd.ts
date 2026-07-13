import { ChannelType, EmbedBuilder, TextBasedChannel, channelMention, GuildMember } from 'discord.js';
import axios from 'axios';

import settings from '../../Database/Schemas/settingsDB';
import WarningDB from '../../Database/Schemas/WarnDB';
import { Event } from '../../Structures/Event';
import { error as logError, info as logInfo } from '../../Utilities/logger';

export default new Event<'guildMemberAdd'>('guildMemberAdd', async (member: GuildMember) => {
	const guild = member.guild;
	const user = member.user ?? undefined;
	if (!guild) return;

	// If the user has prior warnings, optionally enforce a rejoin ban to prevent
	// evading punishments by leaving and rejoining. Threshold is configurable
	// via AUTOMOD_REJOIN_BAN_THRESHOLD (defaults to 2 warnings).
	try {
		const rejoinThreshold = Number(process.env.AUTOMOD_REJOIN_BAN_THRESHOLD ?? 2);
		const warnDoc = await WarningDB.findOne({ GuildID: guild.id, UserID: member.id }).lean().catch(() => null) as unknown as { Warnings?: unknown[] } | null;
		const warnCount = Array.isArray(warnDoc?.Warnings) ? warnDoc.Warnings.length : 0;
		if (warnCount >= rejoinThreshold) {
			// Don't apply rejoin ban to guild owner or test IDs
			try {
				const rawTestIds = process.env.AUTOMOD_TEST_USER_IDS ?? process.env.AUTOMOD_TEST_USER_ID ?? '';
				const TEST_USER_IDS = String(rawTestIds).split(',').map(s => s.trim()).filter(Boolean);
				if (member.id === guild.ownerId) {
					logInfo('guildMemberAdd: skipping rejoin ban for guild owner', { guild: guild.id, user: member.id });
				} else if (TEST_USER_IDS.includes(member.id)) {
					logInfo('guildMemberAdd: skipping rejoin ban for test user', { guild: guild.id, user: member.id });
				} else {
					// Attempt to ban the rejoining member to prevent immediate rejoin.
					if (member.bannable) {
						try {
							await member.ban({ reason: 'Rejoin after multiple warnings' });
							// Post to dashboard (best-effort)
							const url = process.env.AUTOMOD_DASHBOARD_URL;
							const secret = process.env.INTERNAL_SECRET;
							if (url) {
								await axios.post(`${url.replace(/\/$/, '')}/api/v1/automod/${guild.id}/incidents`, { userId: member.id, userDisplayName: user?.globalName ?? user?.username ?? user?.tag, action: 'ban', reason: 'Rejoin after multiple warnings' }, { headers: secret ? { 'x-internal-secret': secret } : {} }).catch(() => null);
							}
							return; // don't send welcome message
						} catch {
							// ignore ban errors and continue to welcome flow
						}
					}
				}
			} catch {
				// non-fatal
			}
		}
	} catch {
		// non-fatal
	}

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