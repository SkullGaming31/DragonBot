/* eslint-disable no-case-declarations */
import { MessageReaction, PartialMessageReaction, PartialUser, Role, User } from 'discord.js';
import { Event } from '../../Structures/Event';

export default new Event<'messageReactionAdd'>('messageReactionAdd', async (reaction: MessageReaction | PartialMessageReaction, reactionUser: User | PartialUser) => {
	let messageReaction: MessageReaction;
	if (reaction.partial) {
		// If the reaction is partial, fetch it to get the complete reaction object
		messageReaction = await reaction.fetch();
	} else {
		messageReaction = reaction;
	}

	// Fetch the member who reacted
	const member = await messageReaction.message.guild?.members.fetch(reactionUser.id);
	if (!member) {
		console.log('Member not found');
		return;
	}

	switch (messageReaction.emoji.name) {
		case '✅':
			// const settings = await SettingsModel.findOne({ GuildID: reaction.message.guild?.id });
			const role: Role | undefined = messageReaction.message.guild?.roles.cache.find(role => role.name === 'Verified');
			if (!role) {
				console.log('Role not found');
				return;
			}
			if (messageReaction.message.id !== '1199602079434555532' || messageReaction.message.channelId !== reaction.message.guild?.rulesChannelId) return;

			await member.roles.add(role);
			break;
		case '📋': {
			// Fetch the role you want to give (replace 'ROLE_NAME' with the name of the role)
			const role: Role | undefined = messageReaction.message.guild?.roles.cache.find(role => role.name === 'Announcements');
			if (!role) {
				console.log('Role not found');
				return;
			}

			// Add the role to the member
			await member.roles.add(role);
			break;
		}
		case '🚀': {
			// Fetch the role you want to give (replace 'ROLE_NAME' with the name of the role)
			const role: Role | undefined = messageReaction.message.guild?.roles.cache.find(role => role.name === 'Space Engineers');
			if (!role) {
				console.log('Role not found');
				return;
			}
			// Add the role to the member
			await member.roles.add(role);
			// console.log(`Role ${role.name} added to user ${member.user.username}`);
			break;
		}
		case '🥷': {
			// Fetch the role you want to give (replace 'ROLE_NAME' with the name of the role)
			const role: Role | undefined = messageReaction.message.guild?.roles.cache.find(role => role.name === 'Warframe');
			if (!role) {
				console.log('Role not found');
				return;
			}

			// Add the role to the member
			await member.roles.add(role);
			// console.log(`Role ${role.name} added to user ${member.user.username}`);
			break;
		}
	}
	// console.log('Message Reaction Object: ', messageReaction);
	// console.log('User Object', reactionUser);
});