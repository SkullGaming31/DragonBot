import { ApplicationCommandType } from 'discord.js';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';
export default new Command({
	name: 'work',
	description: 'Work to make some gold',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	Cooldown: 30000,// set for 24 hours
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		const user = interaction.user;
		const userId = user.id;

		// Check if user has a cooldown entry
		const cooldownDoc = await UserModel.findOne({ id: userId, 'cooldowns.work': { $exists: true } });

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
		await UserModel.findOneAndUpdate(
			{ id: userId },
			{ $inc: { balance: randomGold }, $set: { 'cooldowns.work': Date.now() + 86400000 } }
		);

		return interaction.reply({ content: `You claimed your daily work reward of ${randomGold} gold! Come back tomorrow to work for more money`, });
	}
});