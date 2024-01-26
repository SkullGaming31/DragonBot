/* eslint-disable no-case-declarations */
import axios from 'axios';
import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { Command } from '../../Structures/Command';
import { sleep } from '../../Utilities/util';

interface WarframeData {
	uniqueName: string;
	aura: string;
	name: string;
	health: number;
	shield: number;
	armor: number;
	power: number;
	masteryReq: number;
	buildTime: number;
	abilities: Abilities[];
	components: Components[];
	conclave: boolean;
	consumeOnBuild: boolean;
	description: string;
	exalted: string[];
	imageName: string;
	introduced: Introduced[];
	isPrime: boolean;
	marketCost: number;
	masterable: boolean;
	passiveDescription: string;
	patchLogs: PatchLogs[];
	polarities: string[];
	productCategory: string;
	releaseDate: string;
	sex: string;
	skipBuildTimePrice: number;
	sprint: number;
	sprintSpeed: number;
	stamina: number;
	tradable: boolean;
	type: string;
	wikiaThumbnail: string;
	wikiaUrl: string;
}

interface ItemResponse {
	baseDrain: number;
	category: string;
	compatName: string;
	drops: Drops[];
	fusionLimit: number;
	imageName: string;
	introduced: Introduced;
	isPrime: boolean;
	levelStats: LevelStat[];
	masterable: boolean;
	name: string;
	patchlogs: PatchLogs[];
	polarity: string;
	rarity: string;
	releaseDate: string;
	tradable: boolean;
	transmutable: boolean;
	type: string;
	uniqueName: string;
	wikiaThumbnail: string;
	wikiaUrl: string;
}

interface LevelStat {
	stats: string[];
}

interface PatchLogs {
	name: string;
	date: string;
	url: string;
	additions: string;
	changes: string;
	fixes: string;
}

interface Introduced {
	name: string;
	url: string;
	aliases: string[];
	parent: string;
	date: string;
}
interface Components {
	uniqueName: string;
	name: string;
	description: string;
	itemCount: number;
	imageName: string;
	tradable: boolean;
	masterable: boolean;
	drops: Drops[];
}

interface Drops {
	chance: number;
	location: string;
	rarity: string;
	type: string;
}

interface Abilities {
	name: string;
	description: string;
}

export default new Command({
	name: 'warframe',
	description: 'Information About the free to play game Warframe',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'choice',
			description: 'What Would you like to know about?',
			type: ApplicationCommandOptionType.String,
			choices: [
				{ name: 'about', value: 'about' },
				{ name: 'lore', value: 'lore' },
				{ name: 'mr', value: 'mr' },
				{ name: 'lookup', value: 'lookup' }
			],
			required: true
		},
		{
			name: 'query',
			description: 'Do you want to search for an item or warframe?',
			type: ApplicationCommandOptionType.String,
			choices: [
				{ name: 'warframe', value: 'warframe' },
				{ name: 'item', value: 'item' },
			],
			required: true,
		},
		{
			name: 'name',
			description: 'What item/warframe are you searching for',
			type: ApplicationCommandOptionType.String,
			required: false
		}
	],
	run: async ({ interaction }) => {
		const { options, user } = interaction;
		const Choices = options.getString('choice');
		const Query = options.getString('query');
		const Name = options.getString('name');
		await interaction.deferReply();

		let warframeName = '';
		let itemName = '';

		// Check if Name is not null before assigning values
		if (Query === 'warframe' && Name !== null) {
			warframeName = Name;
		} else if (Query === 'item' && Name !== null) {
			itemName = Name;
		}

		switch (Choices) {
			case 'lore':
				const warframeURL = 'https://warframe.com/landing';
				await interaction.editReply({ content: `In Warframe, players control members of the Tenno, a race of ancient warriors who have awoken from centuries of suspended animation far into Earth's future to find themselves at war in the planetary system with different factions. The Tenno use their powered Warframes along with a variety of weapons and abilities to complete missions. ${warframeURL}` });
				break;
			case 'about':
				await interaction.editReply({ content: 'Warframe is a free-to-play action role-playing third-person shooter multiplayer online game developed and published by Digital Extremes.' });
				break;
			case 'mr':
				const ps4WFRank = 18;
				const embed = new EmbedBuilder()
					.setTitle('Mastery Rank')
					.setDescription('my warframe is now set for cross save, xbl ps4 pc are all my ps4 account now')
					.setAuthor({ name: `${user.globalName}`, iconURL: user.displayAvatarURL({ size: 512 }) })
					.addFields([
						{
							name: 'Xbox:',
							value: `${ps4WFRank}`,
							inline: true
						},
						{
							name: 'Playstation 4: ',
							value: `${ps4WFRank}`,
							inline: true
						},
						{
							name: 'PC: ',
							value: `${ps4WFRank}`,
							inline: true
						}
					])
					.setColor('Green')
					.setTimestamp();
				await interaction.editReply({ embeds: [embed] });
				break;
			case 'lookup':
				try {
					switch (Query) {
						case 'warframe':
							const warframeUrl = `https://api.warframestat.us/warframes/search/${warframeName}`;
							const response = await axios.get(warframeUrl);
							const data = await response.data;
							// console.log('response data: ', data);
							if (!data || data.length === 0) {
								return interaction.editReply({ content: `No Warframe found with the name "${warframeName}"` });
							}
							const warframeData: WarframeData = data[0];
							// console.log('Component Data: ', warframeData.components);

							if (warframeName?.endsWith('Prime')) return interaction.editReply({ content: 'I can not look up prime version of warframes yet' });

							// let prompted = false;
							let message: string | string[];
							if (warframeData) {
								const components = warframeData.components
									.map((component) => {
										const drops = component.drops
											.map((drop) => {
												return `${drop.type} (Rarity: ${drop.rarity}, Chance: ${drop.chance.toFixed(2)}%, Location: ${drop.location})`;
											})
											.join('; ');
										return `${component.name} (Tradeable: ${component.tradable}) - Drops: ${drops}`;
									})
									.join('\n');

								const buildTime = formatTime(warframeData.buildTime);
								const polarities = warframeData.polarities.map(polarity => `${polarity}`).join(', ');

								message = `Warframe: ${warframeData.name}\n - Aura: ${warframeData.aura},\n Build Time: ${buildTime}\n Components:\n${components}\n Tradable: ${warframeData.tradable}\n Masterable: ${warframeData.masterable}\n Mastery Requirement: ${warframeData.masteryReq}\n Polarities: ${polarities}\n Wiki: ${warframeData.wikiaUrl}`;
							} else {
								message = 'No data found for that Warframe.';
							}
							if (message.length > 2000) {
								// Creating buttons
								const row = new ActionRowBuilder<ButtonBuilder>()
									.addComponents(
										new ButtonBuilder()
											.setCustomId('yes')
											.setLabel('yes')
											.setStyle(ButtonStyle.Primary),
										new ButtonBuilder()
											.setCustomId('no')
											.setLabel('no')
											.setStyle(ButtonStyle.Danger)
									);

								// Sending the initial message with buttons
								const initialMessage = await interaction.editReply({ content: 'The message is too long to be sent in chat. Do you want me to send it to you via whisper?', components: [row] });

								// Await button interaction
								const collector = interaction.channel?.createMessageComponentCollector({
									time: 30000, // 30 seconds
									filter: (buttonInteraction) => buttonInteraction.customId === 'yes' || buttonInteraction.customId === 'no',
								});

								collector?.on('collect', async (buttonInteraction) => {
									console.log('buttonInteraction Object: ', buttonInteraction); // Log the entire buttonInteraction object
									console.log('Button Interaction customId: ', buttonInteraction.customId); // Log the customId of the clicked button
									if (buttonInteraction.customId === 'yes') {
										// create DM and send warframe Data
										const tbd = await user.createDM();
										let messageChunks;

										if (Array.isArray(message)) {
											// If message is an array, join it into a single string
											messageChunks = message.join('').match(/.{1,4000}/g);
										} else {
											// If message is a string, split it into chunks
											messageChunks = message.match(/.{1,4000}/g);
										}

										if (messageChunks) {
											try {
												for (const chunk of messageChunks) {
													await tbd.send({ content: `${chunk}` });
													await sleep(3000); // Wait for 3 seconds before sending the next chunk
												}
												if (!buttonInteraction.replied) {
													await buttonInteraction.update({ content: 'The information has been sent to your DMs.', components: [] });
												}
											} catch (error) {
												console.error(error);
												if (!buttonInteraction.replied) {
													await buttonInteraction.update({ content: 'I was unable to send you a DM. Please make sure your DM settings allow me to message you.', components: [] });
												}
											}
										} else {
											console.log('No message chunks to send');
										}
									} else if (buttonInteraction.customId === 'no') {
										if (!buttonInteraction.replied) {
											await buttonInteraction.update({ content: 'You chose not to receive the information via whisper.', components: [] });
										}
									}
								});

								collector?.on('end', async (_, reason) => {
									// console.log(reason); // Log the reason why the collector ended
									if (reason === 'time') {
										await initialMessage.edit({ content: 'You took too long to respond. The buttons have expired.', components: [] });
									}
								});
							} else {
								await interaction.editReply({ content: message });
							}
							break;
						case 'item':
							const itemUrl = `https://api.warframestat.us/items/search/${itemName}`;
							console.log('Item Url: ', itemUrl);
							const itemResponse = await axios.get(itemUrl);
							const itemData: ItemResponse = await itemResponse.data;


							console.log('item response data: ', itemData);

							await interaction.editReply({ content: 'Coming Soon!' });
							break;
					}
				} catch (e) {
					console.error(`Error fetching Warframe data: ${e}`);
					await interaction.editReply({ content: `An error occurred while fetching data for "${warframeName}"` });
				}
				break;
			default:
				break;
		}
	}
});

function formatTime(timeInSeconds: number) {
	const days = Math.floor(timeInSeconds / 86400);
	const hours = Math.floor((timeInSeconds % 86400) / 3600);
	const minutes = Math.floor(((timeInSeconds % 86400) % 3600) / 60);
	const seconds = Math.floor(((timeInSeconds % 86400) % 3600) % 60);

	const formattedDays = days > 0 ? `${days}d ` : '';
	const formattedHours = hours > 0 ? `${hours}h ` : '';
	const formattedMinutes = minutes > 0 ? `${minutes}m ` : '';
	const formattedSeconds = seconds > 0 ? `${seconds}s` : '';

	return `${formattedDays}${formattedHours}${formattedMinutes}${formattedSeconds}`;
}