/* eslint-disable no-case-declarations */
import { randomInt } from 'crypto';
import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonInteraction, ButtonStyle, Collection, CommandInteraction, ComponentType, TextChannel, userMention } from 'discord.js';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

const houseItems: {
	tv: number;
	console: number;
	computer: number;
	laptop: number;
	cash: number;
	jewelry: number; // Added jewelry
	art: number; // Added art
	silverware: number; // Added silverware
	[key: string]: number; // Index signature allowing string keys
} = {
	tv: 1000,
	console: 800,
	computer: 1200,
	laptop: 1500,
	cash: 2000,
	jewelry: 2500,
	art: 3000,
	silverware: 500,
};

// const personItems: {
// 	watch: number;
// 	jewelry: number;
// 	cash: number;
// } = {
// 	watch: 500,
// 	jewelry: 1500,
// 	cash: 1000,
// };

const cashRegisterMin = 200;
const cashRegisterMax = 2000;

interface StoreItems {
	[key: string]: number;
}

const storeItems: StoreItems = {
	cashRegister: randomInt(cashRegisterMin, cashRegisterMax),
	food: 200,
	drink: 150,
	personalBelongings: 1000,
};

// const successOdds: { [item: string]: number } = {
// 	lockpick: 0.3,         // 30% success rate
// 	disguise: 0.2,         // 20% success rate
// 	getawayCar: 0.5,    // 50% success rate
// 	flashlight: 0.1,       // 10% success rate
// 	hackingDevice: 0.4,    // 40% success rate
// };

export default new Command({
	name: 'loot',
	description: 'Loot to get quick cash',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	Category: 'Fun',
	options: [
		{
			name: 'target',
			description: 'gamble [all, %, fixed number] fixed number = betamount',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{ name: 'house', value: 'house' },
				{ name: 'store', value: 'store' },
				{ name: 'person', value: 'person' },
			]
		}
	],
	run: async ({ interaction }) => {
		const { user, options, guild } = interaction;
		const robberyTarget = options.getString('target');
		await interaction.deferReply();

		if (!robberyTarget) {
			return interaction.editReply({ content: 'Please specify a robbery target.', });
		}

		let robberyAmount = 0;
		let stolenItems: string[] = [];

		const updateUserBalance = async (userId: string, amount: number) => {
			try {
				const user = await UserModel.findOne({ guildID: guild?.id, id: userId });

				if (!user) {
					return interaction.editReply({ content: 'User not found in the database.' });
				}
				user.balance = Math.max(user.balance + amount, 0); // Prevent negative balance
				await user.save();
			} catch (error) {
				console.error('Error updating user balance:', error);
			}
		};

		switch (robberyTarget) {
			case 'house':
				const houseValue = Object.values(houseItems).reduce((total, value) => total + value, 0);

				stolenItems = Object.keys(houseItems)
					.sort(() => Math.random() - 0.5)
					.slice(0, Math.floor(Math.random() * 4) + 1);

				if (stolenItems.length === 0) {
					return interaction.editReply({ content: 'You couldn\'t find anything valuable to steal.' });
				}

				const totalStolenValue = stolenItems.reduce((total, item) => total + houseItems[item], 0);
				await updateUserBalance(interaction.user.id, totalStolenValue);

				const formattedItems = stolenItems.map(item => `${item} (${houseItems[item]} gold)`);
				await interaction.editReply({
					content: `You stole ${formattedItems.join(', ')} from the house, totaling ${totalStolenValue} gold! The total possible value in the house was ${houseValue} gold.`
				});
				break;

			case 'person':
				try {
					const usersInDB = await UserModel.find({ guildID: guild?.id });

					if (usersInDB.length === 0) {
						return interaction.editReply({ content: 'No users are registered in the database.' });
					}

					const validMembers = guild?.members.cache.filter(member =>
						!member.user.bot && usersInDB.some(user => user.id === member.id)
					);

					if (validMembers?.size === 0) {
						return interaction.editReply({ content: 'No valid users to rob.' });
					}

					const member = validMembers?.random();
					if (!member) throw new Error('No member found.');

					if (member.id === interaction.user.id) {
						return interaction.editReply({ content: 'You can\'t rob yourself.' });
					}

					const blockChance = randomInt(1, 100);
					if (blockChance <= 20) {
						return interaction.editReply({ content: `${member.user.username} blocked your robbery attempt!` });
					}

					const row = new ActionRowBuilder<ButtonBuilder>()
						.addComponents(
							new ButtonBuilder()
								.setCustomId('block')
								.setLabel('Block')
								.setStyle(ButtonStyle.Danger)
						);

					await interaction.editReply({ content: `${userMention(member.id)}, you are being robbed!`, components: [row] });

					const textChannel = interaction.channel as TextChannel;
					const collector = textChannel.createMessageComponentCollector({
						filter: (i) => i.isButton() && i.user.id === member.id && i.customId === 'block',
						time: 30000,
					});

					collector.on('collect', async (i: ButtonInteraction) => {
						if (i.componentType === ComponentType.Button) {
							collector.stop();
							await i.reply({ content: 'You blocked the robbery attempt!', components: [] });
						}
					});

					collector.on('end', async (collected: Collection<string, ButtonInteraction>) => {
						if (collected.size === 0) {
							await updateUserBalance(member.id, -robberyAmount);
							await interaction.editReply({ content: `You successfully robbed ${userMention(member.id)} and gained ${robberyAmount} gold.`, components: [] });
						}
					});

				} catch (error) {
					console.error(error);
					return interaction.editReply({ content: 'An error occurred while attempting to rob a user.' });
				}
				break;

			case 'store':
				try {
					const discordUser = await UserModel.findOne({ guildID: guild?.id, id: user.id });
					if (!discordUser) throw new Error('User not found.');

					stolenItems = Object.keys(storeItems)
						.sort(() => Math.random() - 0.5)
						.slice(0, randomInt(1, 4)); // Randomly select 1-3 items

					if (stolenItems.length === 0) {
						return interaction.editReply({ content: 'You were unable to steal any valid items.' });
					}

					const stolenValue = stolenItems.reduce((total, item) => total + (storeItems[item] || 0), 0);
					await updateUserBalance(user.id, stolenValue);

					const stolenItemsList = stolenItems.join(', ');
					await interaction.editReply({ content: `You stole ${stolenItemsList} totaling ${stolenValue} gold!`, });
				} catch (error) {
					console.error(error);
					return interaction.editReply({ content: 'An error occurred while attempting to steal from the store.', });
				}
				break;
		}
	},
});