import { ChannelType, EmbedBuilder, GuildMember, PartialGuildMember, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';

export default new Event('guildMemberUpdate', async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {

	const data = await ChanLogger.findOne({ Guild: newMember.guild.id }).catch((err: MongooseError) => { console.error(err.message); });

	if (!data || data.enableLogs === false) return;

	const logsChannelID = data?.Channel;
	if (logsChannelID === undefined) return;
	const logsChannelOBJ = newMember.guild.channels.cache.get(logsChannelID) as TextBasedChannel | null;
	if (!logsChannelOBJ) return;

	const oldRoles = oldMember.roles.cache.map(r => r.id);
	const newRoles = newMember.roles.cache.map(r => r.id);

	const Embed = new EmbedBuilder().setTimestamp();

	if (oldRoles.length > newRoles.length) { // removing a role
		const RoleIDs = Unique(oldRoles, newRoles);
		let description = '';
		RoleIDs.forEach(roleId => {
			const Role = newMember.guild.roles.cache.get(roleId.toString());
			if (Role) {
				description += `\`${newMember.user.globalName}\` has lost the role \`${Role.name}\`\n`;
			}
		});
		if (description && logsChannelOBJ.type === ChannelType.GuildText) {
			logsChannelOBJ.send({
				embeds: [
					Embed.setTitle(`${newMember.guild.name} | Member Update`)
						.setDescription(description)
						.setColor('Red'),
				],
			});
		}
	}
	if (oldRoles.length < newRoles.length) { // adding a role
		const addedRoles = AddedRoles(oldRoles, newRoles);
		console.log('Added roles:', addedRoles); // Debugging statement
		let description = '';
		addedRoles.forEach(roleId => {
			const Role = newMember.guild.roles.cache.get(roleId.toString());
			// console.log('Role:', Role); // Debugging statement
			if (Role) {
				description += `\`${newMember.user.globalName}\` has got the role \`${Role.name}\`\n`;
			}
		});
		if (description && logsChannelOBJ.type === ChannelType.GuildText) {
			logsChannelOBJ.send({
				embeds: [
					Embed.setTitle(`${newMember.guild.name} | Member Update`)
						.setDescription(description)
						.setColor('Green'),
				],
			}).catch(error => console.error('Error sending message:', error)); // Error handling
		}
	}
	console.log('oldRoles: ', oldRoles);
	console.log('newRoles', newRoles);

	if (newMember.nickname !== oldMember.nickname) {
		if (logsChannelOBJ.type === ChannelType.GuildText)
			return logsChannelOBJ.send({
				embeds: [
					Embed.setTitle(`${newMember.guild.name} | Nickname Update`),
					Embed.setDescription(`${newMember.user.globalName}'s nickname has been changed from: \`${oldMember.nickname}\` to: \`${newMember.nickname}\``),
				],
			});
	}
	if (!oldMember.premiumSince && newMember.premiumSince) {
		if (logsChannelOBJ.type === ChannelType.GuildText)
			return logsChannelOBJ.send({
				embeds: [
					Embed.setTitle(`${newMember.guild.name} | Boost Detected`),
					Embed.setDescription(`\`${newMember.user.globalName}\` has started boosting the server`),
				],
			});
	}
	if (!newMember.premiumSince && oldMember.premiumSince) {
		if (logsChannelOBJ.type === ChannelType.GuildText)
			return logsChannelOBJ.send({
				embeds: [
					Embed.setTitle(`${newMember.guild.name} | Unboost Detected`),
					Embed.setDescription(`${newMember.user.globalName} has stopped boosting the server`),
				],
			});
	}
});

// function Unique(oldRoles: string[], newRoles: string[]) {
// 	return newRoles.filter(role => !oldRoles.includes(role));
// }

function Unique(firstArray: string[], secondArray: string[]) {
	return firstArray.filter(role => !secondArray.includes(role));
}
function AddedRoles(oldRoles: string[], newRoles: string[]) {
	return newRoles.filter(role => !oldRoles.includes(role.toString()));
}