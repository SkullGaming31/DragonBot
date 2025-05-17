
import axios from 'axios';
import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder } from 'discord.js';
import { Command } from '../../Structures/Command';

interface WarframeData {
	uniqueName: string;
	aura: string;
	name: string;
	health: number;
	shield: number;
	armor: number;
	power: number;
	masteryReq: number;
	buildPrice?: number;          // Prime-specific
	buildQuantity?: number;       // Prime-specific
	buildTime: number;
	abilities: Abilities[];
	components: Components[];
	conclave: boolean;
	consumeOnBuild: boolean;
	description: string;
	exalted: string[];
	imageName: string;
	introduced: Introduced;
	isPrime: boolean;
	estimatedVaultDate?: string;  // Prime-specific
	marketCost?: number;
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
	vaultDate?: string;           // Prime-specific
	vaulted?: boolean;            // Prime-specific
	wikiAvailable?: boolean;      // Prime-specific
	wikiaThumbnail: string;
	wikiaUrl: string;
}

interface ItemResponse {
	description: string;
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
	primeSellingPrice?: number;   // Prime-specific
	ducats?: number;              // Prime-specific
	masterable: boolean;
	drops: Drops[];
}

interface Drops {
	chance: number;
	location: string;
	rarity: string;
	type: string;
	uniqueName?: string;          // Prime-specific (relic identifier)
}

interface Abilities {
	uniqueName?: string;          // Prime-specific
	name: string;
	description: string;
	imageName?: string;           // Prime-specific
}

export default new Command({
	name: 'warframe',
	description: 'Information About the free to play game Warframe',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	Category: 'Information',
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
				switch (Query) {
					case 'warframe':
						const warframeUrl = `https://api.warframestat.us/warframes/search/${warframeName}`;
						const response = await axios.get(warframeUrl);
						const data = await response.data;

						if (!data || data.length === 0) {
							return interaction.editReply({ content: `No Warframe found with the name "${warframeName}"` });
						}

						const warframeData: WarframeData = data[0];

						// Create component fields with appropriate display for Prime vs non-Prime
						const componentFields = warframeData.components.map((component) => {
							let dropsText = '';

							if (warframeData.isPrime) {
								// Prime component display
								dropsText = component.drops.map(drop => {
									return `Relic: ${drop.location}\nRarity: ${drop.rarity}\nChance: ${drop.chance.toFixed(2)}%`;
								}).join('\n\n');

								return {
									name: `${component.name} ${component.ducats ? `(${component.ducats} ducats)` : ''}`,
									value: `Tradable: ${component.tradable ? 'Yes' : 'No'}\nDrops:\n${dropsText}`,
									inline: false
								};
							} else {
								// Non-Prime component display
								dropsText = component.drops.map(drop => {
									return `${drop.location} (${drop.rarity}, ${drop.chance.toFixed(2)}%)`;
								}).join('\n');

								return {
									name: component.name,
									value: `Tradable: ${component.tradable ? 'Yes' : 'No'}\nDrops:\n${dropsText}`,
									inline: false
								};
							}
						});

						// Create the embed
						const warframeEmbed = new EmbedBuilder()
							.setTitle(`${warframeData.name}`)
							.setDescription(warframeData.description || 'No description available')
							.addFields([
								{
									name: 'Health',
									value: `${warframeData.health}`,
									inline: true
								},
								{
									name: 'Shield',
									value: `${warframeData.shield}`,
									inline: true
								},
								{
									name: 'Armor',
									value: `${warframeData.armor}`,
									inline: true
								},
								{
									name: 'Power',
									value: `${warframeData.power}`,
									inline: true
								},
								{
									name: 'Aura Polarity',
									value: `${warframeData.aura || 'None'}`,
									inline: true
								},
								{
									name: 'Polarities',
									value: `${warframeData.polarities.join(', ') || 'None'}`,
									inline: true
								},
								{
									name: 'Mastery Requirement',
									value: `${warframeData.masteryReq}`,
									inline: true
								},
								{
									name: 'Build Time',
									value: formatTime(warframeData.buildTime),
									inline: true
								},
								{
									name: 'Tradable',
									value: `${warframeData.tradable ? 'Yes' : 'No'}`,
									inline: true
								},
								...componentFields
							])
							.setThumbnail(warframeData.imageName || 'https://via.placeholder.com/150')
							.setURL(warframeData.wikiaUrl)
							.setTimestamp();

						// Add Prime-specific fields if applicable
						if (warframeData.isPrime) {
							warframeEmbed.addFields([
								{
									name: 'Vault Status',
									value: warframeData.vaulted ? `Vaulted (since ${warframeData.vaultDate})` : 'Unvaulted',
									inline: true
								},
								{
									name: 'Release Date',
									value: warframeData.releaseDate,
									inline: true
								}
							]);
						}

						// Handle abilities if they exist
						if (warframeData.abilities && warframeData.abilities.length > 0) {
							warframeEmbed.addFields(
								warframeData.abilities.map(ability => ({
									name: ability.name,
									value: ability.description,
									inline: false
								}))
							);
						}

						// Send the embed
						await interaction.editReply({ embeds: [warframeEmbed] });
						break;
					case 'item':
						try {
							const itemUrl = `https://api.warframestat.us/items/search/${itemName}`;
							// console.log('Item Url: ', itemUrl);
							const itemResponse = await axios.get(itemUrl);
							const itemData: ItemResponse[] = await itemResponse.data;

							// console.log('item response data: ', itemData);

							if (!itemData || itemData.length === 0) {
								return interaction.editReply({ content: `No item found with the name "${itemName}"` });
							}

							// Assuming you want to display information about the first item found
							const firstItem = itemData[0];

							const fields: { name: string; value: string }[] = [];

							if ('components' in firstItem) {
								// Access the components array and assert its type
								const componentsArray = (firstItem as { components: Components[] }).components;

								// Iterate over each component
								componentsArray.forEach((component: Components, index: number) => {
									// Construct fields for each component
									fields.push({
										name: `Recipe Item ${index + 1}`,
										value: `Name: ${component.name}\nDescription: \`${component.description}\`\nItem Count: ${component.itemCount}\n`
									});
								});
							} else {
								fields.push({
									name: 'Components',
									value: 'This item does not have components.'
								});
							}

							const itemEmbed = new EmbedBuilder()
								.setTitle(firstItem.name)
								.setDescription(firstItem.description)
								.addFields([
									{
										name: 'Category',
										value: firstItem.category
									},
									{
										name: 'Type',
										value: firstItem.type
									},
									{
										name: 'Tradable',
										value: firstItem.tradable ? 'Yes' : 'No'
									}
								])
								.addFields(fields) // Add the fields array to the embed
								.setThumbnail(`https://cdn.warframestat.us/img/${firstItem.imageName}`)
								.setTimestamp();

							await interaction.editReply({ embeds: [itemEmbed] });
						} catch (error) {
							console.error(error);
						}
						break;
					default:
						break;
				}
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