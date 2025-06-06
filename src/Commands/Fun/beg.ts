// import { ApplicationCommandType, channelMention, MessageFlags } from 'discord.js';
// import SettingsModel from '../../Database/Schemas/settingsDB';
// import { UserModel } from '../../Database/Schemas/userModel';
// import { Command } from '../../Structures/Command';

// export default new Command({// TODO: Check to see if a econ channel has been set, if not just send it to the channel they are using the command in
// 	name: 'beg',
// 	description: 'Beg for some coins',
// 	UserPerms: ['SendMessages'],
// 	BotPerms: ['SendMessages'],
// 	defaultMemberPermissions: ['SendMessages'],
// 	Category: 'Fun',
// 	type: ApplicationCommandType.ChatInput,
// 	run: async ({ interaction }) => {
// 		const { guild, user } = interaction;
// 		const userId = user.id;

// 		// Check if user has a cooldown entry
// 		const cooldownDoc = await UserModel.findOne({ guildID: guild?.id, id: userId, 'cooldowns.beg': { $exists: true } });

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

// 			return interaction.reply({ content: `you can beg again in ${timeLeftString}.`, flags: MessageFlags.Ephemeral });
// 		}

// 		// Generate random amount of gold within a specified range
// 		const minGold = 50; // Minimum amount of gold
// 		const maxGold = 300; // Maximum amount of gold
// 		const randomGold = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;

// 		// Update user balance and cooldown
// 		await UserModel.findOneAndUpdate({ guildID: guild?.id, id: userId }, { $inc: { balance: randomGold }, $set: { 'cooldowns.beg': Date.now() + 86400000 } });

// 		const begMessages = [
// 			'Please kind sir, may I have some gold? I haven\'t eaten in days!',
// 			'Just a few coins would be greatly appreciated, good sir.',
// 			'I\'m down on my luck, could you spare some gold for a poor soul?',
// 			'With a heavy heart, I beg for your generosity. Any amount helps.',
// 			'Bless your kind heart if you could spare a few coins for a struggling traveler.',
// 		];

// 		const randomIndex = Math.floor(Math.random() * begMessages.length);
// 		const randomMessage = begMessages[randomIndex];

// 		return interaction.reply({ content: `${randomMessage}, You claimed your daily reward of ${randomGold} gold! Come back tomorrow for another chance.`, });
// 	}
// });

import { ApplicationCommandType, channelMention, MessageFlags } from 'discord.js';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'beg',
	description: 'Beg for some coins',
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
		}).select('cooldowns.beg');

		// Check if cooldown exists and is still active
		if (userDoc?.cooldowns?.beg) {
			const now = Date.now();
			const cooldownEnd = userDoc.cooldowns.beg;

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
					content: `You can beg again in ${timeLeft}.`,
					flags: MessageFlags.Ephemeral
				});
			}
		}

		// Generate random gold amount
		const minGold = 50;
		const maxGold = 300;
		const randomGold = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;

		// Update user balance and set new cooldown
		await UserModel.findOneAndUpdate(
			{ guildID: guild?.id, id: userId },
			{
				$inc: { balance: randomGold },
				$set: { 'cooldowns.beg': Date.now() + 43200000 } // 12-hour cooldown
			},
			{ upsert: true, new: true }
		);

		const begMessages = [
			'Please kind sir, may I have some gold? I haven\'t eaten in days!',
			'Just a few coins would be greatly appreciated, good sir.',
			'I\'m down on my luck, could you spare some gold for a poor soul?',
			'With a heavy heart, I beg for your generosity. Any amount helps.',
			'Bless your kind heart if you could spare a few coins for a struggling traveler.',
		];

		const randomMessage = begMessages[Math.floor(Math.random() * begMessages.length)];

		return interaction.reply({
			content: `${randomMessage}, You received ${randomGold} gold! Come back in 12 hours for another chance.`
		});
	}
});