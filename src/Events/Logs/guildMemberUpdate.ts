import { ChannelType, EmbedBuilder, GuildMember, PartialGuildMember, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import { Event } from '../../../src/Structures/Event';
import ChanLogger from '../../Database/Schemas/LogsChannelDB';

export default new Event<'guildMemberUpdate'>('guildMemberUpdate', async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
	const { guild, user } = newMember;

	const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => { console.error(err.message); });

	if (!data || data.enableLogs === false) return;

	const logsChannelID = data?.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelOBJ = guild.channels.cache.get(logsChannelID) as TextBasedChannel | null;
	if (!logsChannelOBJ) return;

	const oldRoles = oldMember.roles.cache.map(r => r.id);
	const newRoles = newMember.roles.cache.map(r => r.id);

	const Embed = new EmbedBuilder().setColor('Red').setTimestamp();

	if (oldRoles.length > newRoles.length) {
		const RoleID = Unique(oldRoles, newRoles);
		const Role = guild.roles.cache.get(RoleID[0].toString());

		if (logsChannelOBJ.type === ChannelType.GuildText)
			return logsChannelOBJ.send({
				embeds: [
					Embed.setTitle(`${guild.name} | Member Update`),
					Embed.setDescription(`\`${user.tag}\` has lost the role \`${Role?.name}\``),
				],
			});
	} else if (oldRoles.length < newRoles.length) {
		const RoleID = Unique(oldRoles, newRoles);
		const Role = guild.roles.cache.get(RoleID[0].toString());

		if (logsChannelOBJ.type === ChannelType.GuildText)
			return logsChannelOBJ.send({
				embeds: [
					Embed.setTitle(`${guild.name} | Member Update`),
					Embed.setDescription(`\`${user.tag}\` has got the role \`${Role?.name}\``),
				],
			});
	} else if (newMember.nickname !== oldMember.nickname) {
		if (logsChannelOBJ.type === ChannelType.GuildText)
			return logsChannelOBJ.send({
				embeds: [
					Embed.setTitle(`${guild.name} | Nickname Update`),
					Embed.setDescription(`${newMember.user.tag}'s nickname has been changed from: \`${oldMember.nickname}\` to: \`${newMember.nickname}\``),
				],
			});
	} else if (!oldMember.premiumSince && newMember.premiumSince) {
		if (logsChannelOBJ.type === ChannelType.GuildText)
			return logsChannelOBJ.send({
				embeds: [
					Embed.setTitle(`${guild.name} | Boost Detected`),
					Embed.setDescription(`\`${newMember.user.tag}\` has started boosting the server`),
				],
			});
	} else if (!newMember.premiumSince && oldMember.premiumSince) {
		if (logsChannelOBJ.type === ChannelType.GuildText)
			return logsChannelOBJ.send({
				embeds: [
					Embed.setTitle(`${guild.name} | Unboost Detected`),
					Embed.setDescription(`${newMember.user.tag} has stopped boosting the server`),
				],
			});
	}
});

function Unique(arr1: string[], arr2: string[]) {
	const unique1 = arr1.filter((o) => arr2.indexOf(o) === -1);
	const unique2 = arr2.filter((o) => arr1.indexOf(o) === -1);
	const unique = unique1.concat(unique2);
	return unique;
}