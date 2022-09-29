import { ChannelType, Colors, EmbedBuilder, GuildMember, PartialGuildMember } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
// import ChanLogger from '../../Structures/Schemas/LogsChannelDB';// DB
// import GenLogs from '../../Structures/Schemas/GeneralLogsDB'; //SwitchDB

export default new Event('guildMemberUpdate', async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
	const { guild, user } = newMember;


	const logsChannel = '765920602287636481';
	const Channel = guild.channels.cache.get(logsChannel);
	if (!Channel) return;

	const oldRoles = oldMember.roles.cache.map(r => r.id);
	const newRoles = newMember.roles.cache.map(r => r.id);

	const Embed = new EmbedBuilder()
		.setColor(Colors.Red)
		.setTimestamp();

	if (oldRoles.length > newRoles.length) {
		const RoleID = Unique(oldRoles, newRoles);
		const Role = guild.roles.cache.get(RoleID[0].toString());

		if (Channel.type === ChannelType.GuildText)
			return Channel.send({
				embeds: [
					Embed.setTitle(`${guild.name} | Member Update`),
					Embed.setDescription(`\`${user.tag}\` has lost the role \`${Role?.name}\``)
				]
			});
	} else if (oldRoles.length < newRoles.length) {
		const RoleID = Unique(oldRoles, newRoles);
		const Role = guild.roles.cache.get(RoleID[0].toString());

		if (Channel.type === ChannelType.GuildText)
			return Channel.send({
				embeds: [
					Embed.setTitle(`${guild.name} | Member Update`),
					Embed.setDescription(`\`${user.tag}\` has got the role \`${Role?.name}\``)
				]
			});
	} else if (newMember.nickname !== oldMember.nickname) {
		if (Channel.type === ChannelType.GuildText)
			return Channel.send({
				embeds: [
					Embed.setTitle(`${guild.name} | Nickname Update`),
					Embed.setDescription(`${newMember.user.tag}'s nickname has been changed from: \`${oldMember.nickname}\` to: \`${newMember.nickname}\``)
				]
			});
	} else if (!oldMember.premiumSince && newMember.premiumSince) {
		if (Channel.type === ChannelType.GuildText)
			return Channel.send({
				embeds: [
					Embed.setTitle(`${guild.name} | Boost Detected`),
					Embed.setDescription(`\`${newMember.user.tag}\` has started boosting the server`)
				]
			});
	} else if (!newMember.premiumSince && oldMember.premiumSince) {
		if (Channel.type === ChannelType.GuildText)
			return Channel.send({
				embeds: [
					Embed.setTitle(`${guild.name} | Unboost Detected`),
					Embed.setDescription(`${newMember.user.tag} has stopped boosting the server`)
				]
			});
	}
});

function Unique(arr1: string[], arr2: string[]) {
	const unique1 = arr1.filter(o => arr2.indexOf(o) === -1);
	const unique2 = arr2.filter(o => arr1.indexOf(o) === -1);
	const unique = unique1.concat(unique2);
	return unique;
}