 
import { ApplicationCommandOptionType, ApplicationCommandType, MessageFlags } from 'discord.js';
import { IUser, UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'gamble',
	description: 'Gamble your coins and have a chance to win more',
	type: ApplicationCommandType.ChatInput,
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	Category: 'Fun',
	options: [
		{
			name: 'option',
			description: 'gamble [all, %, fixed number] fixed number = betamount',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{ name: 'fixed number', value: 'fixed number' },
				{ name: 'percentage', value: 'percentage' },
				{ name: 'all', value: 'all' },
			]
		},
		{
			name: 'amount',
			description: 'The amount you want to gamble (number, percentage, or "all")',
			type: ApplicationCommandOptionType.Number,
			required: false,
		}
	],
	run: async ({ interaction }) => {
		try {
			const { options, member, user, guild } = interaction;
			const Amount = options.getNumber('amount') || -1;
			const Options = options.getString('option');

			// Retrieve user from database 
			let userModel: IUser | null;
			try {
				userModel = await UserModel.findOne<IUser>({ guildID: guild?.id, id: user.id });
			} catch (error) {
				console.error('Error retrieving user from database:', error);
				await interaction.reply({ content: 'An error occurred while retrieving user information.' });
				return;
			}
			if (!guild) return;

			if (typeof Amount?.valueOf() !== 'number') { return interaction.reply({ content: 'Please enter a valid number for your gamble amount.' }); }

			if (!userModel || userModel.balance === undefined) { return interaction.reply({ content: 'You don\'t have any coins to gamble!' }); }

			switch (Options) {
				case 'all'://DONE !gamble [all] gamble everything in there balance
					try {
						const currentBalance = await UserModel.findOne({ guildID: guild.id, id: user.id });
						if (!currentBalance || currentBalance.balance === undefined) return;
						if (currentBalance.balance === 0) return interaction.reply({ content: 'You do not have any gold to gamble away', flags: MessageFlags.Ephemeral });

						const winProbability = member?.roles.cache.has('Twitch Subscriber') ?? false ? 0.25 : 0.2;
						const isWin = Math.random() <= winProbability;

						const winAmount = isWin ? currentBalance?.balance * 2 : -currentBalance?.balance; // Update balance based on win/loss

						await UserModel.findOneAndUpdate({ guildID: guild.id, id: user.id }, { $inc: { balance: winAmount } });

						const finalResponse = isWin ? `Congratulations! You risked it all and won ${winAmount} gold!` : `Sorry, you lost ${winAmount} gold.`;

						await interaction.reply({ content: finalResponse });
					} catch (error) {
						console.error(error);
					}
					break;
				case 'percentage': //DONE !gamble [percentage] ex !gamble 20% of your balance
					try {
						const currentBalance = await UserModel.findOne({ guildID: guild.id, id: user.id });
						if (!currentBalance || currentBalance.balance === undefined) return;
						if (currentBalance.balance === 0) return interaction.reply({ content: 'You do not have any gold to gamble away', flags: MessageFlags.Ephemeral });

						const percentage = Amount as number; // Assuming Amount is already validated as a number representing the percentage
						if (percentage <= 0 || percentage > 100) return interaction.reply({ content: 'Please enter a valid percentage between 1 and 100.' });

						const amountToGamble = currentBalance.balance * (percentage / 100); // Calculate the amount to gamble based on the percentage
						const winProbability = member?.roles.cache.has('Twitch Subscriber') ?? false ? 0.25 : 0.2;
						const isWin = Math.random() <= winProbability;

						const winAmount = isWin ? Number((amountToGamble * 2).toFixed(2)) : Number((-amountToGamble).toFixed(2)); // Update balance based on win/loss

						await UserModel.findOneAndUpdate({ guildID: guild.id, id: user.id }, { $inc: { balance: winAmount }, });

						const finalResponse = isWin ? `Congratulations! You risked ${percentage}% of your balance and won ${winAmount} gold!` : `Sorry, you lost ${percentage}% of your balance, resulting in ${winAmount} gold loss.`;

						await interaction.reply({ content: finalResponse });
					} catch (error) {
						console.error(error);
					}
					break;
				case 'fixed number'://DONE !gamble [Amount] ex !gamble 500coins from your balance
					const fixedAmount = Amount as number; // Assuming Amount is already validated as a number
					if (userModel.balance < fixedAmount) return interaction.reply({ content: 'You can not cover that bet with your current Balance, please use ``/bal`` and try again', flags: MessageFlags.Ephemeral });

					if (fixedAmount <= 0) await interaction.reply({ content: 'Please enter a positive amount to gamble.' });

					// Check if user has the "Twitch Subscriber" role
					const hasTwitchSubscriberRole = member?.roles.cache.has('Twitch Subscriber') ?? false; // Check for role and handle potential undefined member or role cache

					const winProbability = hasTwitchSubscriberRole ? 0.25 : 0.2;
					const isWin = Math.random() <= winProbability;
					const winAmount = isWin ? fixedAmount * 2 : -fixedAmount; // Calculate win/loss amount

					try {
						await UserModel.findOneAndUpdate({ guildID: guild.id, id: user.id }, { $inc: { balance: winAmount } });
						const response = isWin ? `Congratulations! You won ${winAmount} gold.` : `Sorry, you lost ${winAmount} gold.`;
						await interaction.reply({ content: response });
					} catch (error) {
						console.error(error);
					}
					break;
				default:
					break;
			}
		} catch (error) {
			console.error('Error in gamble command:', error);
			await interaction.reply({ content: 'An error occurred while processing your gamble.' });
		}
	},
});