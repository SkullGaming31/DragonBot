import { ApplicationCommandType, channelMention } from 'discord.js';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

export default new Command({// TODO: Check to see if a econ channel has been set, if not just send it to the channel they are using the command in
	name: 'work',
	description: 'Work to make some gold',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	Cooldown: 30000,
	type: ApplicationCommandType.ChatInput,
	Category: 'Fun',
	run: async ({ interaction }) => {
		const { guild } = interaction;
		const user = interaction.user;
		const userId = user.id;

		// Check if user has a cooldown entry
		const cooldownDoc = await UserModel.findOne({ guildID: guild?.id, id: userId, 'cooldowns.work': { $exists: true } });

		const settingsDoc = await SettingsModel.findOne({ GuildID: guild?.id });

		const economyChannelID = settingsDoc?.EconChan;
		if (economyChannelID) {
			const econChannel = interaction.guild?.channels.cache.get(economyChannelID);
			if (econChannel === undefined) return;

			if (interaction.channel?.id !== econChannel?.id) {
				return interaction.reply({ content: `All economy commands should be used in ${channelMention(econChannel?.id)}. Please try again there.`, ephemeral: true });
			}
		}

		if (cooldownDoc) {
			const now = Date.now();
			const difference = now - 1709831270035;
			const hours = Math.floor((difference % 86400000) / 3600000);
			const minutes = Math.floor((difference % 3600000) / 60000);
			const seconds = Math.floor((difference % 60000) / 1000);

			const timeLeftString = `${hours ? ` ${hours} hour${hours !== 1 ? 's' : ''}` : ''}${minutes ? ` ${minutes} minute${minutes !== 1 ? 's' : ''}` : ''}${seconds ? ` ${seconds} second${seconds !== 1 ? 's' : ''}` : ''}`;

			return interaction.reply({ content: `You can claim your daily work reward again in ${timeLeftString}.`, ephemeral: true });
		}

		// Generate random amount of gold within a specified range
		const minGold = 500; // Minimum amount of gold
		const maxGold = 2000; // Maximum amount of gold
		const randomGold = Math.floor(Math.random() * (maxGold - minGold + 1)) + minGold;

		// Update user balance and cooldown
		await UserModel.findOneAndUpdate({ guildID: guild?.id, id: userId }, { $inc: { balance: randomGold }, $set: { 'cooldowns.work': Date.now() + 86400000 } });

		return interaction.reply({ content: `You claimed your daily work reward of ${randomGold} gold! Come back tomorrow to work for more money`, });
	}
});