
import { ApplicationCommandOptionType, ApplicationCommandType, MessageFlags } from 'discord.js';
import { IUser, UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';
import { error as logError } from '../../Utilities/logger';

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
				{ name: 'all', value: 'all' }
			],
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
			const Amount = options.getNumber('amount');
			const Options = options.getString('option') || '';

			// Retrieve user from database 
			let userModel: IUser | null;
			try {
				userModel = await UserModel.findOne<IUser>({ guildID: guild?.id, id: user.id });
			} catch {
				// console.error('Error retrieving user from database');
				await interaction.reply({ content: 'An error occurred while retrieving user information.' });
				return;
			}
			if (!guild) return;

			if (typeof Amount?.valueOf() !== 'number') { return interaction.reply({ content: 'Please enter a valid number for your gamble amount.' }); }

			if (!userModel || userModel.balance === undefined) { return interaction.reply({ content: 'You don\'t have any coins to gamble!' }); }

			const twitchSubRoleId = guild.roles.cache.find((r) => r.name === 'Twitch Subscriber')?.id;
			let hasTwitchSubscriberRole = false;
			if (twitchSubRoleId && member) {
				if (Array.isArray(member.roles)) {
					hasTwitchSubscriberRole = member.roles.includes(twitchSubRoleId);
				} else {
					hasTwitchSubscriberRole = member.roles.cache.has(twitchSubRoleId);
				}
			}
			const winProbability = hasTwitchSubscriberRole ? 0.25 : 0.2;

			switch (Options) {
				case 'all'://DONE !gamble [all] gamble everything in there balance
					try {
						const currentBalance = await UserModel.findOne({ guildID: guild.id, id: user.id });
						if (!currentBalance || currentBalance.balance === undefined) return;
						if (currentBalance.balance === 0) return interaction.reply({ content: 'You do not have any gold to gamble away', flags: MessageFlags.Ephemeral });

						const gambled = Math.floor(currentBalance.balance);
						const isWin = Math.random() <= winProbability;
						const winAmount = isWin ? gambled : -gambled; // $inc will add/subtract the gambled amount

						// Atomic update: only apply if user still has at least `gambled` balance
						const updated = await UserModel.findOneAndUpdate(
							{ guildID: guild.id, id: user.id, balance: { $gte: gambled } },
							{ $inc: { balance: winAmount } }
						);
						if (!updated) {
							return interaction.reply({ content: 'You do not have enough gold to gamble. Try again.', flags: MessageFlags.Ephemeral });
						}

						const finalResponse = isWin ? `Congratulations! You risked it all and won ${gambled} gold!` : `Sorry, you lost ${gambled} gold.`;
						await interaction.reply({ content: finalResponse });
					} catch (_error) {
						logError('Gamble (all) error', { error: (_error as Error)?.message ?? _error });
					}
					break;
				case 'percentage': //DONE !gamble [percentage] ex !gamble 20% of your balance
					try {
						const currentBalance = await UserModel.findOne({ guildID: guild.id, id: user.id });
						if (!currentBalance || currentBalance.balance === undefined) return;
						if (currentBalance.balance === 0) return interaction.reply({ content: 'You do not have any gold to gamble away', flags: MessageFlags.Ephemeral });

						if (typeof Amount !== 'number') return interaction.reply({ content: 'Please provide a percentage as the amount (1-100).' });
						const percentageRaw = Math.floor(Amount);
						const percentage = percentageRaw;
						if (percentage <= 0 || percentage > 100) return interaction.reply({ content: 'Please enter a valid percentage between 1 and 100.' });

						// Compute gamble amount using integer math (floor to avoid fractional coins)
						const amountToGamble = Math.floor((currentBalance.balance * percentage) / 100);
						if (amountToGamble <= 0) return interaction.reply({ content: 'The percentage you provided is too small to gamble any coins.' });

						const isWin = Math.random() <= winProbability;
						const delta = isWin ? amountToGamble : -amountToGamble;

						// Atomic update: only apply if user still has at least `amountToGamble`
						const updated = await UserModel.findOneAndUpdate(
							{ guildID: guild.id, id: user.id, balance: { $gte: amountToGamble } },
							{ $inc: { balance: delta } }
						);
						if (!updated) {
							return interaction.reply({ content: 'You do not have enough gold to gamble that percentage. Try again.', flags: MessageFlags.Ephemeral });
						}

						const abs = Math.abs(delta);
						const finalResponse = isWin ? `Congratulations! You risked ${percentage}% of your balance and won ${abs} gold!` : `Sorry, you lost ${abs} gold (${percentage}% of your balance).`;

						await interaction.reply({ content: finalResponse });
					} catch (_error) {
						logError('Gamble (percentage) error', { error: (_error as Error)?.message ?? _error });
					}
					break;
				case 'fixed number'://DONE !gamble [Amount] ex !gamble 500coins from your balance
					const fixedRaw = Amount;
					if (typeof fixedRaw !== 'number') return interaction.reply({ content: 'Please provide a valid amount to gamble.' });
					const fixedAmount = Math.floor(fixedRaw);
					if (fixedAmount <= 0) return interaction.reply({ content: 'Please enter a positive amount to gamble.' });

					const isWinFixed = Math.random() <= winProbability;
					const deltaFixed = isWinFixed ? fixedAmount : -fixedAmount;

					try {
						// Atomic update: only apply if user still has at least `fixedAmount`
						const updated = await UserModel.findOneAndUpdate(
							{ guildID: guild.id, id: user.id, balance: { $gte: fixedAmount } },
							{ $inc: { balance: deltaFixed } }
						);
						if (!updated) {
							return interaction.reply({ content: 'You can not cover that bet with your current Balance, please use ``/bal`` and try again', flags: MessageFlags.Ephemeral });
						}
						const response = isWinFixed ? `Congratulations! You won ${fixedAmount} gold.` : `Sorry, you lost ${fixedAmount} gold.`;
						await interaction.reply({ content: response });
					} catch (_error) {
						logError('Gamble (fixed) error', { error: (_error as Error)?.message ?? _error });
					}
					break;
				default:
					break;
			}
		} catch (error) {
			logError('Error in gamble command:', { error: (error as Error)?.message ?? error });
			await interaction.reply({ content: 'An error occurred while processing your gamble.' });
		}
	},
});