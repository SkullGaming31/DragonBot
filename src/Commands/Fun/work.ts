// import { ApplicationCommandType, channelMention, MessageFlags } from 'discord.js';
// import SettingsModel from '../../Database/Schemas/settingsDB';
// import { UserModel } from '../../Database/Schemas/userModel';
// import { Command } from '../../Structures/Command';

// export default new Command({// TODO: Check to see if a econ channel has been set, if not just send it to the channel they are using the command in
// 	name: 'work',
// 	description: 'Work to make some gold',
// 	UserPerms: ['SendMessages'],
// 	BotPerms: ['SendMessages'],
// 	defaultMemberPermissions: ['SendMessages'],
// 	Cooldown: 30000,
// 	type: ApplicationCommandType.ChatInput,
// 	Category: 'Fun',
// 	run: async ({ interaction }) => {
// 		const { guild } = interaction;
// 		const user = interaction.user;
// 		const userId = user.id;

// 		// Check if user has a cooldown entry
// 		const cooldownDoc = await UserModel.findOne({ guildID: guild?.id, id: userId, 'cooldowns.work': { $exists: true } });

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

// 			return interaction.reply({ content: `You can claim your daily work reward again in ${timeLeftString}.`, flags: MessageFlags.Ephemeral });
// 		}

// 		// Generate random amount of gold within a specified range
// 		const minGold = 500; // Minimum amount of gold
// 		const maxGold = 2000; // Maximum amount of gold
// 		const randomGold = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;

// 		// Update user balance and cooldown
// 		await UserModel.findOneAndUpdate({ guildID: guild?.id, id: userId }, { $inc: { balance: randomGold }, $set: { 'cooldowns.work': Date.now() + 86400000 } });

// 		return interaction.reply({ content: `You claimed your daily work reward of ${randomGold} gold! Come back tomorrow to work for more money`, });
// 	}
// });

import { ApplicationCommandType, channelMention, MessageFlags } from 'discord.js';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'work',
	description: 'Work to earn gold',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	Category: 'Fun',
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		const { guild, user } = interaction;
		const userId = user.id;

		// Check economy channel
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

		// Check cooldown
		const userDoc = await UserModel.findOne({
			guildID: guild?.id,
			id: userId
		}).select('cooldowns.work');

		if (userDoc?.cooldowns?.work) {
			const now = Date.now();
			const cooldownEnd = userDoc.cooldowns.work;

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
					content: `You can work again in ${timeLeft}.`,
					flags: MessageFlags.Ephemeral
				});
			}
		}

		// Weighted reward system
		const rewardTiers = [
			{ weight: 5, min: 50, max: 100 },    // 50% chance: 50-100 coins
			{ weight: 3, min: 101, max: 200 },   // 30% chance: 101-200 coins
			{ weight: 2, min: 201, max: 400 }    // 20% chance: 201-400 coins
		];

		// Create weighted pool
		const pool = [];
		for (const tier of rewardTiers) {
			for (let i = 0; i < tier.weight; i++) {
				pool.push(tier);
			}
		}

		// Select random tier
		const selectedTier = pool[Math.floor(Math.random() * pool.length)];
		const randomGold = Math.floor(
			Math.random() * (selectedTier.max - selectedTier.min + 1)
		) + selectedTier.min;

		// Update user data
		await UserModel.findOneAndUpdate(
			{ guildID: guild?.id, id: userId },
			{
				$inc: { balance: randomGold },
				$set: { 'cooldowns.work': Date.now() + 28800000 } // 8-hour cooldown
			},
			{ upsert: true, new: true }
		);

		const workMessages = [
			`You worked as a blacksmith and earned ${randomGold} gold!`,
			`Your shift at the tavern netted you ${randomGold} gold!`,
			`After a day's labor in the mines, you made ${randomGold} gold!`,
			`Your merchant stall sales brought in ${randomGold} gold!`,
			`Guarding the castle walls earned you ${randomGold} gold!`
		];

		return interaction.reply({
			content: `${workMessages[Math.floor(Math.random() * workMessages.length)]} Come back in 8 hours for another shift.`
		});
	}
});