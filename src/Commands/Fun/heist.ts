import { randomInt } from 'crypto';
import { ApplicationCommandOptionType, ApplicationCommandType, Collection, EmbedBuilder, GuildTextBasedChannel, TextChannel, channelMention, userMention } from 'discord.js';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

interface Participant {
	userId: string; // User ID for future reference
	username: string; // Username for display purposes
}

type LootValue = {
	[itemName: string]: number | Gems | Antique | Artwork | Cash;
};

const lootValues: LootValue = {
	gold: 2000,
	silver: 1500,
	artwork: {
		Paintings: 5000,
		Sculptures: 4000,
		Prints: 3000,
		Photography: 2000,
		Tapestry: 1500,
		ArtisticInstallations: 1000,
		DecorativeArtObjects: 500,
	},
	antique: {
		RareCoins: 1000,
		Currency: 800,
		Documents: 1200,
		Artifacts: 2500,
		Jewelry: 2000,
		Timepieces: 1500,
		Porcelain: 800,
		Ceramics: 1000,
		Collectibles: 1200,
	},
	gems: {
		ruby: 1000,
		diamond: 2000,
		sapphire: 1500,
		Emerald: 1800,
		Aquamarine: 1200,
		Topaz: 800,
		Opal: 1000,
		Amethyst: 900,
		Garnet: 700,
		Pearl: 600,
	},
	cash: {
		Bill1000: 1000,
		Bill500: 500,
		Bill5000: 5000,
		Bill10000: 10000,
		Bill100000: 100000,
	},
	documents: 500,
};

interface Cash {
	Bill1000: number;
	Bill500: number;
	Bill5000: number;
	Bill10000: number;
	Bill100000: number;
}

interface Artwork {
	Paintings: number;
	Sculptures: number;
	Prints: number;
	Photography: number;
	Tapestry: number;
	ArtisticInstallations: number;
	DecorativeArtObjects: number;
}

interface Antique {
	RareCoins: number;
	Currency: number;
	Documents: number;
	Artifacts: number;
	Jewelry: number;
	Timepieces: number;
	Porcelain: number;
	Ceramics: number;
	Collectibles: number;
}

interface Gems {
	diamond: number;
	ruby: number;
	sapphire: number;
	Emerald: number;
	Aquamarine: number;
	Topaz: number;
	Opal: number;
	Amethyst: number;
	Garnet: number;
	Pearl: number;
}

interface LootResult {
	totalAmount: number;
	items: string[];
	message: string;
}

export default new Command({
	name: 'heist',
	description: 'Start a heist with friends',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	Category: 'Fun',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'amount',
			description: 'The amount you want to bet on the heist! 1000-10000',
			type: ApplicationCommandOptionType.Number,
			required: true,
		}
	],
	run: async ({ interaction }) => {
		const { options, user, guild } = interaction;
		try {
			await interaction.deferReply();

			const Amount = options.getNumber('amount');
			if (!Amount) return;
			if (Amount < 1000 || Amount > 10000) return interaction.editReply({ content: 'The bet amount must be between 1000-10000' });

			const settingsDoc = await SettingsModel.findOne({ GuildID: guild?.id });
			const economyChannelID = settingsDoc?.EconChan;
			if (economyChannelID) {
				const econChannel = interaction.guild?.channels.cache.get(economyChannelID);
				if (econChannel === undefined) {
					console.warn(`Economy channel ${economyChannelID} not found.`);
				} else if (interaction.channel?.id !== econChannel?.id) {
					return interaction.editReply({ content: `All economy commands should be used in ${channelMention(econChannel?.id)}. Please try again there.` });
				}
			}

			// Check if the user balance is sufficient for the bet amount
			const userBalance = await UserModel.findOne({ guildID: guild?.id, id: user.id }).then(user => user?.balance);
			if (!userBalance || userBalance < Amount) {
				return interaction.editReply({ content: 'You don\'t have enough coins to start this heist!' });
			}

			const updatedBalance = userBalance - Amount;
			await UserModel.findOneAndUpdate({ guildID: guild?.id, id: user.id }, { balance: updatedBalance });

			let heistInProgress = false;
			const participants: Collection<string, Participant> = new Collection();
			const baseChance = 0.1;
			const participantBonus = 0.05;
			const joinMessagesMap = new Map();

			if (heistInProgress) return interaction.editReply({ content: 'A heist is already in progress. Please wait for it to finish!' });

			const heistMessage = await interaction.editReply({ content: '**Heist starting in 60 seconds! React with ✅ to participate.**' });
			const heistMessageDetails = await heistMessage.fetch();
			try {
				const { tryReact } = await import('../../Utilities/retry');
				await tryReact(heistMessageDetails as unknown, '✅').catch(() => null);
			} catch {
				// ignore
			}

			const collector = heistMessageDetails.createReactionCollector({
				filter: (reaction, user) => !user.bot && reaction.emoji.name === '✅',
				time: 60000,
				dispose: true
			});

			collector.on('collect', async (reaction, user) => {
				const participant: Participant = {
					userId: user.id,
					username: user.username
				};
				participants.set(user.id, participant);

				// Calculate the odds of winning based on the number of participants
				const successChance = baseChance + (participants.size * participantBonus);
				const oddsOfWinning = Math.round(successChance * 100);

				const channel = reaction.message.channel as TextChannel;
				if (channel) {
					const participantJoinMessage = await channel.send({ content: `${userMention(user.id)} has joined the heist! Current odds of winning: ${oddsOfWinning}%` });
					joinMessagesMap.set(user.id, participantJoinMessage.id);
				}
			});

			collector.on('remove', async (reaction, user) => {
				const userId = user.id;
				if (!user.bot && reaction.emoji.name === '✅') {
					if (participants.has(userId)) {
						participants.delete(userId);

						const successChance = baseChance + (participants.size * participantBonus);
						const oddsOfWinning = Math.round(successChance * 100);

						const channel = reaction.message.channel as TextChannel;
						if (channel) {
							await channel.send(`${userMention(userId)} has left the heist. Current odds of winning: ${oddsOfWinning}%`);
						}

						if (participants.size === 0) {
							channel.send('Not enough participants joined. Heist cancelled!');
							heistInProgress = false;
							await reaction.message.reactions.removeAll();
						}
					}
				}
			});

			collector.on('end', async () => {
				if (process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug') {
					if (participants.size < 1) {
						await interaction.editReply({ content: 'Not enough participants joined. Heist cancelled!' });
						await heistMessage.reactions.removeAll();
						return;
					}
				} else {
					if (participants.size < 2) {
						await interaction.editReply({ content: 'Not enough participants joined. Heist cancelled!' });
						await heistMessage.reactions.removeAll();
						return;
					}
				}

				const successChance = baseChance + (participants.size * participantBonus);
				const randomValue = randomInt(1, 100);
				const success = randomValue <= successChance * 100;

				const textChannel = interaction.channel as GuildTextBasedChannel;
				if (!heistInProgress) {
					await heistMessage.reactions.removeAll();
					const messageIdsToDelete = Array.from(joinMessagesMap.values());
					if (textChannel) {
						try {
							await textChannel.bulkDelete(messageIdsToDelete, true).catch((err) => { console.error(err); });
						} catch (error) {
							console.error('Failed to bulk delete messages:', error);
							for (const messageId of messageIdsToDelete) {
								try {
									await interaction.channel?.messages.fetch(messageId).then(message => message.delete());
								} catch (error) {
									console.error('Failed to delete message:', error);
								}
							}
						}
					}
				}
				let loot: number = 0;
				let stolenItems: string[] = [];
				const numWinners = randomInt(1, participants.size + 1);
				const participantArray = Array.from(participants.values());
				const shuffledParticipants = participantArray.sort(() => 0.5 - Math.random());
				const winners = shuffledParticipants.slice(0, numWinners);

				if (success) {
					const lootResult = calculateLoot();
					loot = lootResult.totalAmount;
					stolenItems = lootResult.items;

					const winningAmount = Math.floor(loot / numWinners); // Move this line inside the if (success) block
					if (participants.size > 0) {
						let winnerString = '```Winners: \n';
						for (const winner of winners) {
							const filter = { guildID: guild?.id, id: winner.userId };
							const update = { $inc: { balance: winningAmount } };
							const options = { new: true };
							await UserModel.findOneAndUpdate(filter, update, options);
							winnerString += `${winner.username}: ${winningAmount} coins\n`;
						}
						winnerString += '```\n';
						winnerString += '```Stolen Items: \n';
						for (const item of stolenItems) {
							winnerString += `${item}\n`;
						}
						winnerString += '```';

						const embed = new EmbedBuilder()
							.setTitle('Heist Winners')
							.setDescription(winnerString)
							.setTimestamp();
						await interaction.editReply({ content: '**Heist completed!**', embeds: [embed] });
						participants.clear();
					} else {
						await textChannel.send({ content: 'There were no participants in the heist.' });
						participants.clear();
					}
				} else {
					await interaction.editReply({ content: '**Heist completed!** The heist has failed, Everyone Loses' });
				}
			});
		} catch (error) {
			console.error(error);
		}
	},
});

// Function to calculate the loot amount and items for the heist
function calculateLoot(): LootResult {
	const lootItems = Object.entries(lootValues);
	const numItems = randomInt(1, 9);
	let totalLootAmount = 0;
	const chosenItems: string[] = [];

	const bonusMultiplier = 1;

	for (let i = 0; i < numItems; i++) {
		const [itemName, itemValue] = lootItems[randomInt(0, lootItems.length - 1)];
		const lootWorth = getValue(itemValue);

		const adjustedLootWorth = lootWorth * bonusMultiplier;

		if (totalLootAmount + adjustedLootWorth < 0) {
			totalLootAmount = 0;
			break;
		} else {
			totalLootAmount += adjustedLootWorth;
			chosenItems.push(itemName);
		}
	}

	const resultMessage = '';

	return {
		totalAmount: totalLootAmount,
		items: chosenItems,
		message: resultMessage,
	};
}

// Function to get the numerical value of a loot item
function getValue(item: number | Gems | Antique | Artwork | Cash): number {
	if (typeof item === 'number') {
		return item;
	} else if (typeof item === 'object') {
		if (Array.isArray(item)) {
			return item.reduce((sum, value) => sum + value, 0);
		} else {
			const values = Object.values(item);
			return values.reduce((sum, value) => sum + value, 0);
		}
	} else {
		throw new Error('Invalid loot item type.');
	}
}