
import { randomInt } from 'crypto';
import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonInteraction, ButtonStyle, Collection, ComponentType, TextChannel, userMention } from 'discord.js';
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

interface StoreType {
	description: string;
	items: {
		[key: string]: number;
	};
	securityLevel: number;
	specialEventChance: number;
}

const STORE_TYPES: Record<string, StoreType> = {
	CONVENIENCE: {
		description: '🏪 24/7 QuickMart',
		items: {
			snacks: 50,
			energyDrink: 75,
			lotteryTicket: 200,
			cashRegister: randomInt(300, 1500)
		},
		securityLevel: 2,
		specialEventChance: 0.3
	},
	ELECTRONICS: {
		description: '📱 Tech Haven Store',
		items: {
			headphones: 300,
			smartwatch: 500,
			gamingConsole: 800,
			laptop: 1200
		},
		securityLevel: 4,
		specialEventChance: 0.5
	},
	JEWELRY: {
		description: '💎 Luxury Jewelers',
		items: {
			goldChain: 1500,
			diamondRing: 3000,
			rolex: 5000,
			cashRegister: randomInt(1000, 5000)
		},
		securityLevel: 5,
		specialEventChance: 0.7
	}
};

// interface StoreItems {
// 	[key: string]: number;
// }

// const storeItems: StoreItems = {
// 	cashRegister: randomInt(cashRegisterMin, cashRegisterMax),
// 	food: 200,
// 	drink: 150,
// 	personalBelongings: 1000,
// };

// const successOdds: { [item: string]: number } = {
// 	lockpick: 0.3,         // 30% success rate
// 	disguise: 0.2,         // 20% success rate
// 	getawayCar: 0.5,    // 50% success rate
// 	flashlight: 0.1,       // 10% success rate
// 	hackingDevice: 0.4,    // 40% success rate
// };

function randomChoice<T>(options: T[]): T {
	return options[Math.floor(Math.random() * options.length)];
}

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
		const HOUSE_COOLDOWN = 3_600_000; // 1 hour cooldown
		const POLICE_ALERT_INCREASE = 0.15; // 15% increased detection chance

		if (!robberyTarget) {
			return interaction.editReply({ content: 'Please specify a robbery target.', });
		}

		// const robberyAmount = 0;

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
				// Fetch user data with cooldown and alert level
				const userData = await UserModel.findOne({
					guildID: guild?.id,
					id: user.id
				});
				if (!userData) return interaction.editReply({ content: '❌ User data not found!' });

				// Cooldown check
				if (userData.houseCooldown && Date.now() < userData.houseCooldown.getTime()) {
					const remaining = userData.houseCooldown.getTime() - Date.now();
					const minutes = Math.ceil(remaining / (1000 * 60));
					return interaction.editReply(
						`⏳ You must wait ${minutes} minute(s) before robbing another house!`
					);
				}

				// Dynamic caught chance calculation
				const baseCaughtChance = 0.3;
				const caughtChance = baseCaughtChance +
					(userData.policeAlertLevel * POLICE_ALERT_INCREASE);

				if (Math.random() < caughtChance) {
					// Set cooldown on failure
					userData.houseCooldown = new Date(Date.now() + HOUSE_COOLDOWN);
					await userData.save();
					return interaction.editReply({
						content: '🚨 You got caught by the homeowners! Police arrived immediately!',
					});
				}

				// Determine number of items stolen
				const stealTiers = [
					{ items: 4, chance: 0.1 },
					{ items: 3, chance: 0.25 },
					{ items: 2, chance: 0.4 },
					{ items: 1, chance: 0.2 },
					{ items: 0, chance: 0.05 }
				];

				let stolenCount = 0;
				const roll = Math.random();
				let accumulated = 0;
				for (const tier of stealTiers) {
					accumulated += tier.chance;
					if (roll < accumulated) {
						stolenCount = tier.items;
						break;
					}
				}

				if (stolenCount === 0) {
					// Set cooldown even on failed search
					userData.houseCooldown = new Date(Date.now() + HOUSE_COOLDOWN);
					await userData.save();
					return interaction.editReply({
						content: '🔍 You searched the house but couldn\'t find anything valuable!'
					});
				}

				// Steal items
				const shuffledItems = Object.keys(houseItems).sort(() => Math.random() - 0.5);
				const stolenItems = shuffledItems.slice(0, stolenCount);

				// Calculate stolen value
				const totalStolenValue = stolenItems.reduce((total, item) => {
					const baseValue = houseItems[item];
					const variation = baseValue * 0.2;
					return total + baseValue + randomInt(-variation, variation);
				}, 0);

				// Update systems
				await updateUserBalance(interaction.user.id, totalStolenValue);
				userData.policeAlertLevel += 1;
				userData.houseCooldown = new Date(Date.now() + HOUSE_COOLDOWN);
				await userData.save();

				// Format response
				const formattedItems = stolenItems.map(item => {
					const emoji = {
						tv: '📺', console: '🎮', computer: '💻',
						laptop: '🖥️', cash: '💵', jewelry: '💍',
						art: '🖼️', silverware: '🍴'
					}[item] || '💎';
					return `${emoji} ${item.charAt(0).toUpperCase() + item.slice(1)}`;
				});

				await interaction.editReply({
					content: [
						'🏠 **House Robbery Report**',
						`✅ Successfully stole ${stolenCount} items:`,
						`${formattedItems.join('\n')}`,
						`💰 Total Value: ${totalStolenValue.toLocaleString()} gold`,
						`⚠️ Police Alert Level: ${userData.policeAlertLevel} (+15% detection chance)`
					].join('\n')
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

					// Get victim's current balance
					const victimUser = await UserModel.findOne({ guildID: guild?.id, id: member.id });
					const victimBalance = victimUser?.balance || 0;

					if (victimBalance <= 0) {
						return interaction.editReply({ content: `${member.user.username} is broke! Nothing to steal.` });
					}

					// Calculate robbery amount (10-30% of victim's balance)
					const stolenPercentage = randomInt(10, 30) / 100;
					let stolenAmount = Math.floor(victimBalance * stolenPercentage);
					stolenAmount = Math.min(stolenAmount, victimBalance); // Ensure we don't take more than available

					const row = new ActionRowBuilder<ButtonBuilder>()
						.addComponents(
							new ButtonBuilder()
								.setCustomId('block')
								.setLabel('Block')
								.setStyle(ButtonStyle.Danger)
						);

					await interaction.editReply({
						content: `${userMention(member.id)}, you are being robbed of ${stolenAmount} gold!`,
						components: [row]
					});

					const textChannel = interaction.channel as TextChannel;
					const collector = textChannel.createMessageComponentCollector({
						filter: (i) => i.isButton() && i.user.id === member.id && i.customId === 'block',
						time: 30000,
					});

					collector.on('collect', async (i: ButtonInteraction) => {
						if (i.componentType === ComponentType.Button) {
							collector.stop();
							await i.update({
								content: 'You blocked the robbery attempt!',
								components: []
							});
						}
					});

					collector.on('end', async (collected: Collection<string, ButtonInteraction>) => {
						if (collected.size === 0) {
							// Update both balances
							await updateUserBalance(member.id, -stolenAmount);
							await updateUserBalance(interaction.user.id, stolenAmount);

							await interaction.editReply({
								content: `Successfully robbed ${stolenAmount} gold from ${userMention(member.id)}!`,
								components: []
							});
						}
					});

				} catch (error) {
					console.error(error);
					return interaction.editReply({ content: 'An error occurred while attempting to rob a user.' });
				}
				break;
			case 'store':
				try {
					const userData = await UserModel.findOne({ guildID: guild?.id, id: user.id });
					if (!userData) throw new Error('User not found');

					// Helper functions
					const getStoreLoot = (store: StoreType): string[] => {
						const items = Object.keys(store.items);
						return items
							.sort(() => Math.random() - 0.5)
							.slice(0, randomInt(1, 3))
							.filter(() => Math.random() > 0.3);
					};

					const getSpecialStoreEvent = (): string => {
						const specialEvents = {
							securityTape: 'Found security tape wiping evidence!',
							vaultCode: 'Stole manager\'s vault code!',
							deliverySchedule: 'Intercepted delivery schedule!'
						};
						return Object.keys(specialEvents)[randomInt(0, 2)];
					};

					// Store selection
					const storeKeys = Object.keys(STORE_TYPES);
					const randomStoreKey = storeKeys[randomInt(0, storeKeys.length - 1)] as keyof typeof STORE_TYPES;
					const currentStore = STORE_TYPES[randomStoreKey];

					// Create button component
					const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId('grab')
							.setLabel('SNEAK GRAB!')
							.setStyle(ButtonStyle.Danger)
							.setEmoji('👋')
					);

					// Send initial response with button
					await interaction.editReply({
						content: [
							`${currentStore.description}`,
							`**Security Level:** ${'🔒'.repeat(currentStore.securityLevel)}`,
							randomChoice([
								'You hear a faint alarm beeping...',
								'A security camera slowly pans across the room',
								'The clerk is distracted by a customer complaint'
							])
						].join('\n'),
						components: [actionRow]
					});

					const collector = interaction.channel?.createMessageComponentCollector({
						componentType: ComponentType.Button,
						filter: (i: ButtonInteraction) =>
							i.user.id === interaction.user.id &&
							i.customId === 'grab',
						time: 7500,
						max: 1 // Only allow one interaction
					});

					if (!collector) throw new Error('Could not create collector');

					collector.on('collect', async (i: ButtonInteraction) => {
						try {
							// Early return if already handled
							if (i.replied || i.deferred) return;
							// Defer FIRST
							await i.deferUpdate();

							// Calculate success chance
							const baseSuccess = 0.6 - (currentStore.securityLevel * 0.1);
							const successRoll = Math.random();

							if (successRoll > baseSuccess) {
								const fine = randomInt(100, 500);
								const userBalance = userData.balance;

								try {
									// Update cooldown on any outcome
									userData.storeCooldown = new Date(Date.now() + 300000);
									await userData.save();

									if (userBalance >= fine) {
										await updateUserBalance(user.id, -fine);
										return i.editReply({
											content: `🚨 **CAUGHT!** Paid ${fine} gold from your balance!`,
											components: []
										});
									} else {
										// Jail handling with permission check
										const member = await guild?.members.fetch(user.id);
										if (member && guild?.members.me?.permissions.has('ModerateMembers')) {
											await member.timeout(300000, 'Failed robbery fine');
											return i.editReply({
												content: '⛓️ **JAILED!** 5 minute timeout for insufficient funds!',
												components: []
											});
										}
										// Fallback penalty
										await updateUserBalance(user.id, -userBalance);
										return i.editReply({
											content: `🚨 **CAUGHT!** Lost all ${userBalance} gold!`,
											components: []
										});
									}
								} catch (jailError) {
									console.error('Jail failed:', jailError);
									return i.editReply({
										content: '🚨 **CAUGHT!** Error processing penalty!',
										components: []
									});
								}
							}

							// Successful robbery handling
							try {
								const stolenItems = getStoreLoot(currentStore);
								let totalValue = stolenItems.reduce((sum, item) =>
									sum + (currentStore.items[item] || 0), 0);

								if (Math.random() < currentStore.specialEventChance) {
									stolenItems.push(getSpecialStoreEvent());
									totalValue *= 1.5;
								}

								// Update cooldown and balance
								userData.storeCooldown = new Date(Date.now() + 300000);
								await userData.save();
								await updateUserBalance(user.id, totalValue);

								const itemDisplay = stolenItems.map(item =>
									`• ${item.replace(/([A-Z])/g, ' $1').toUpperCase()}`
								).join('\n');

								await i.editReply({
									content: [
										'🏃♂️ **SUCCESSFUL HEIST!**',
										`Stolen Items:\n${itemDisplay}`,
										`💰 Total Value: ${totalValue} gold`,
										randomChoice([
											'You escaped through the loading dock!',
											'A customer accidentally blocked security!',
											'Your getaway driver was waiting out back!'
										])
									].join('\n'),
									components: []
								});

							} catch (heistError) {
								console.error('Heist error:', heistError);
								await i.editReply({
									content: '❌ Failed to complete heist!',
									components: []
								});
							}

						} catch (error) {
							console.error('Button processing error:', error);
							if (!i.replied && !i.deferred) {
								await i.followUp({
									content: '❌ Critical error during robbery!',
									ephemeral: true
								});
							}
						}
					});

					collector?.on('end', async () => {
						try {
							await interaction.editReply({ components: [] });
						} catch (error) {
							console.error('Cleanup error:', error);
						}
					});
				} catch (error) {
					console.error(error);
					await interaction.editReply({
						content: randomChoice([
							'🔦 The store lights suddenly went out!',
							'🚓 A police patrol drove by unexpectedly!',
							'📢 The PA system announced closing time!'
						])
					});
				}
				break;
		}
	},
});