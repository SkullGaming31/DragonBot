// import { ApplicationCommandType, channelMention, MessageFlags } from 'discord.js';
// import SettingsModel from '../../Database/Schemas/settingsDB';
// import { UserModel } from '../../Database/Schemas/userModel';
// import { Command } from '../../Structures/Command';

// export default new Command({// TODO: Check to see if a econ channel has been set, if not just send it to the channel they are using the command in
// 	name: 'daily',
// 	description: 'Claim your daily gold reward.',
// 	UserPerms: ['SendMessages'],
// 	BotPerms: ['SendMessages'],
// 	defaultMemberPermissions: ['SendMessages'],
// 	Cooldown: 30000, // 86400000 24 hours
// 	Category: 'Fun',
// 	type: ApplicationCommandType.ChatInput,
// 	run: async ({ interaction }) => {
// 		const { guild } = interaction;
// 		const user = interaction.user;
// 		const userId = user.id;

// 		// Check if user has a cooldown entry
// 		const cooldownDoc = await UserModel.findOne({ guildID: guild?.id, id: userId, 'cooldowns.daily': { $exists: true } });

// 		const settingsDoc = await SettingsModel.findOne({ GuildID: guild?.id });

// 		const economyChannelID = settingsDoc?.EconChan;
// 		if (economyChannelID) {
// 			const econChannel = interaction.guild?.channels.cache.get(economyChannelID);
// 			if (econChannel === undefined) return;

// 			if (interaction.channel?.id !== econChannel?.id) {
// 				return interaction.reply({ content: `All economy commands should be used in ${channelMention(econChannel?.id)}. Please try again there.`, flags: MessageFlags.Ephemeral });
// 			}
// 		}

// 		if (cooldownDoc) {
// 			const now = Date.now();
// 			const difference = now - 1709831270035;
// 			const hours = Math.floor((difference % 86400000) / 3600000);
// 			const minutes = Math.floor((difference % 3600000) / 60000);
// 			const seconds = Math.floor((difference % 60000) / 1000);

// 			const timeLeftString = `${hours ? ` ${hours} hour${hours !== 1 ? 's' : ''}` : ''}${minutes ? ` ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}${seconds ? ` ${seconds} second${seconds !== 1 ? 's' : ''}` : ''}`;

// 			return interaction.reply({ content: `You can claim your daily reward again in ${timeLeftString}.`, flags: MessageFlags.Ephemeral });
// 		}

// 		// Generate random amount of gold within a specified range
// 		const minGold = 100; // Minimum amount of gold
// 		const maxGold = 1000; // Maximum amount of gold
// 		const randomGold = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;

// 		// Update user balance and cooldown
// 		await UserModel.findOneAndUpdate(
// 			{ guildID: guild?.id, id: userId },
// 			{ $inc: { balance: randomGold }, $set: { 'cooldowns.daily': Date.now() + 86400000 } }
// 		);

// 		return interaction.reply({ content: `You claimed your daily reward of ${randomGold} gold! Come back tomorrow for another chance.`, });
// 	},
// });

import { ApplicationCommandType, channelMention, MessageFlags } from 'discord.js';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'daily',
	description: 'Claim your daily gold reward.',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	Category: 'Fun',
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		const { guild, user } = interaction;
		const userId = user.id;

		// Check economy channel first
		const settingsDoc = await SettingsModel.findOne({ GuildID: guild?.id });
		const economyChannelID = settingsDoc?.EconChan;

		if (economyChannelID) {
			const econChannel = interaction.guild?.channels.cache.get(economyChannelID);
			if (econChannel && interaction.channel?.id !== econChannel.id) {
				return interaction.reply({
					content: `All economy commands should be used in ${channelMention(econChannel.id)}. Please try again there.`,
					flags: MessageFlags.Ephemeral
				});
			}
		}

		// Get user document with cooldown info
		const userDoc = await UserModel.findOne({
			guildID: guild?.id,
			id: userId
		}).select('cooldowns.daily');

		// Check if cooldown exists and is still active
		if (userDoc?.cooldowns?.daily) {
			const now = Date.now();
			const cooldownEnd = userDoc.cooldowns.daily;

			if (now < cooldownEnd) {
				const difference = cooldownEnd - now;
				const hours = Math.floor(difference / 3600000);
				const minutes = Math.floor((difference % 3600000) / 60000);
				const seconds = Math.floor((difference % 60000) / 1000);

				const timeLeft = [
					hours ? `${hours} hour${hours !== 1 ? 's' : ''}` : '',
					minutes ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : '',
					seconds ? `${seconds} second${seconds !== 1 ? 's' : ''}` : ''
				].filter(Boolean).join(', ');

				return interaction.reply({
					content: `You can claim your daily reward again in ${timeLeft}.`,
					flags: MessageFlags.Ephemeral
				});
			}
		}

		// Generate random gold amount
		const minGold = 100;
		const maxGold = 1000;
		const randomGold = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;

		// Update user balance and set new cooldown
		await UserModel.findOneAndUpdate(
			{ guildID: guild?.id, id: userId },
			{
				$inc: { balance: randomGold },
				$set: { 'cooldowns.daily': Date.now() + 86400000 } // 24-hour cooldown
			},
			{ upsert: true, new: true }
		);

		return interaction.reply({
			content: `You claimed your daily reward of ${randomGold} gold! Come back tomorrow for another chance.`
		});
	},
});