/* eslint-disable no-case-declarations */
import { MessageReaction, PartialMessageReaction, PartialUser, Role, User } from 'discord.js';
import { Event } from '../../Structures/Event';

export default new Event<'messageReactionRemove'>('messageReactionRemove', async (reaction: MessageReaction | PartialMessageReaction, reactionUser: User | PartialUser) => {
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
		case '🚀': {
			// Fetch the role you want to give (replace 'ROLE_NAME' with the name of the role)
			const role: Role | undefined = messageReaction.message.guild?.roles.cache.find(role => role.name === 'Space Engineers');
			if (!role) {
				console.log('Role not found');
				return;
			}
			// Add the role to the member
			await member.roles.remove(role);
			console.log(`Role ${role.name} removed from user ${member.user.username}`);
			break;
		}
		case '🧌': {
			// Fetch the role you want to give (replace 'ROLE_NAME' with the name of the role)
			const role: Role | undefined = messageReaction.message.guild?.roles.cache.find(role => role.name === 'pals');
			if (!role) {
				console.log('Role not found');
				return;
			}

			// Add the role to the member
			await member.roles.remove(role);
			break;
		}
		case '🔫': {
			// Fetch the role you want to give (replace 'ROLE_NAME' with the name of the role)
			const role: Role | undefined = messageReaction.message.guild?.roles.cache.find(role => role.name === 'vigor');
			if (!role) {
				console.log('Role not found');
				return;
			}

			// Add the role to the member
			await member.roles.remove(role);
			console.log(`Role ${role.name} added to user ${member.user.username}`);
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
			await member.roles.remove(role);
			console.log(`Role ${role.name} added to user ${member.user.username}`);
			break;
		}
		// Add more cases for other reactions if needed
		default:
			console.log('Unhandled reaction: ', messageReaction.emoji.name);
	}
	console.log('Message Reaction Object: ', messageReaction);
	console.log('User Object', reactionUser);
});