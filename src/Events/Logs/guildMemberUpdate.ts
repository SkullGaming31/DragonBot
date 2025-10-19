import { ChannelType, EmbedBuilder, GuildMember, PartialGuildMember, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';
import { error as logError, info as logInfo } from '../../Utilities/logger';

export default new Event('guildMemberUpdate', async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
	const guild = newMember.guild;

	let data;
	try {
		data = await ChanLogger.findOne({ Guild: guild.id });
	} catch (_err) {
		logError('guildMemberUpdate: failed to read LogsChannelDB', { error: (_err as Error)?.message ?? _err });
		return;
	}

	if (!data || data.enableLogs === false) return;

	const logsChannelID = data?.Channel;
	if (logsChannelID === undefined) return;
	let logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
	if (!logsChannelOBJ) logsChannelOBJ = (await guild.channels.fetch(logsChannelID).catch(() => undefined)) as TextBasedChannel | undefined;
	if (!logsChannelOBJ) return;

	// Safely extract role IDs from oldMember (which may be PartialGuildMember)
	let oldRoles: string[] = [];
	const oldRolesCache = (oldMember as PartialGuildMember & { roles?: { cache?: Iterable<{ id: string }> } })?.roles?.cache;
	if (oldRolesCache) {
		try {
			const maybeArrayFn = (oldRolesCache as unknown as { array?: () => unknown })?.array;
			if (typeof maybeArrayFn === 'function') {
				const arr = maybeArrayFn.call(oldRolesCache) as Array<{ id: string }>;
				oldRoles = arr.map(r => r.id);
			} else {
				oldRoles = Array.from(oldRolesCache as Iterable<{ id: string }>).map(r => r.id);
			}
		} catch {
			oldRoles = [];
		}
	}
	const newRoles = newMember.roles?.cache ? Array.from(newMember.roles.cache.values()).map(r => r.id) : [];

	const Embed = new EmbedBuilder().setTitle(`${guild.name} | Member Update`).setTimestamp();

	if (oldRoles.length > newRoles.length) { // removing a role
		const RoleIDs = Unique(oldRoles, newRoles);
		let description = '';
		RoleIDs.forEach(roleId => {
			const Role = guild.roles.cache.get(roleId.toString());
			if (Role) {
				description += `\`${newMember.user.globalName}\` has lost the role \`${Role.name}\`\n`;
			}
		});
		if (description && logsChannelOBJ.type === ChannelType.GuildText) {
			try {
				await logsChannelOBJ.send({ embeds: [Embed.setDescription(description).setColor('Red')] });
				logInfo('guildMemberUpdate: role removed', { guild: guild.id, member: newMember.id, roles: RoleIDs });
			} catch (err) {
				logError('guildMemberUpdate: failed to send role-removed embed', { error: (err as Error)?.message ?? err });
			}
		}
	}
	if (oldRoles.length < newRoles.length) { // adding a role
		const addedRoles = AddedRoles(oldRoles, newRoles);
		let description = '';
		addedRoles.forEach(roleId => {
			const Role = guild.roles.cache.get(roleId.toString());
			if (Role) {
				description += `\`${newMember.user.globalName}\` has got the role \`${Role.name}\`\n`;
			}
		});
		if (description && logsChannelOBJ.type === ChannelType.GuildText) {
			try {
				await logsChannelOBJ.send({ embeds: [Embed.setDescription(description).setColor('Green')] });
				logInfo('guildMemberUpdate: role added', { guild: guild.id, member: newMember.id, roles: addedRoles });
			} catch (err) {
				logError('guildMemberUpdate: failed to send role-added embed', { error: (err as Error)?.message ?? err });
			}
		}
	}

	const oldNickname = (oldMember as PartialGuildMember)?.nickname ?? null;
	if (newMember.nickname !== oldNickname) {
		if (logsChannelOBJ.type === ChannelType.GuildText) {
			try {
				await logsChannelOBJ.send({ embeds: [Embed.setDescription(`${newMember.user.globalName}'s nickname has been changed from: \`${oldNickname}\` to: \`${newMember.nickname}\``)] });
				logInfo('guildMemberUpdate: nickname changed', { guild: guild.id, member: newMember.id });
			} catch (err) {
				logError('guildMemberUpdate: failed to send nickname embed', { error: (err as Error)?.message ?? err });
			}
		}
	}
	const oldPremiumSince = (oldMember as PartialGuildMember)?.premiumSince ?? null;
	if (!oldPremiumSince && newMember.premiumSince) {
		if (logsChannelOBJ.type === ChannelType.GuildText) {
			try {
				await logsChannelOBJ.send({ embeds: [Embed.setDescription(`\`${newMember.user.globalName}\` has started boosting the server`)] });
				logInfo('guildMemberUpdate: started boosting', { guild: guild.id, member: newMember.id });
			} catch (err) {
				logError('guildMemberUpdate: failed to send boost embed', { error: (err as Error)?.message ?? err });
			}
		}
	}
	if (!newMember.premiumSince && oldPremiumSince) {
		if (logsChannelOBJ.type === ChannelType.GuildText) {
			try {
				await logsChannelOBJ.send({ embeds: [Embed.setDescription(`${newMember.user.globalName} has stopped boosting the server`)] });
				logInfo('guildMemberUpdate: stopped boosting', { guild: guild.id, member: newMember.id });
			} catch (err) {
				logError('guildMemberUpdate: failed to send unboost embed', { error: (err as Error)?.message ?? err });
			}
		}
	}
});

function Unique(firstArray: string[], secondArray: string[]) {
	return firstArray.filter(role => !secondArray.includes(role));
}
function AddedRoles(oldRoles: string[], newRoles: string[]) {
	return newRoles.filter(role => !oldRoles.includes(role.toString()));
}