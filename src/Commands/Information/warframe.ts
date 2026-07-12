import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, MessageFlags } from 'discord.js';
import { Command } from '../../Structures/Command';
import { error as logError } from '../../Utilities/logger';
import axios from 'axios';

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
	Category: 'Information',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'lore',
			description: 'Show a summary of Warframe lore',
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: 'about',
			description: 'Show an overview of Warframe',
			type: ApplicationCommandOptionType.Subcommand,
		},
		{
			name: 'mr',
			description: 'Show example Mastery Rank information',
			type: ApplicationCommandOptionType.Subcommand
		},
		{
			name: 'lookup',
			description: 'Lookup a Warframe or item by name',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'type',
					description: 'Choose warframe or item',
					type: ApplicationCommandOptionType.String,
					required: true,
					choices: [
						{ name: 'warframe', value: 'warframe' },
						{ name: 'item', value: 'item' }
					]
				},
				{
					name: 'name',
					description: 'The name of the item or warframe to lookup',
					type: ApplicationCommandOptionType.String,
					required: true
				}
			]
		}
	],
	run: async ({ interaction }) => {
		const { options, user } = interaction;
		const subcommand = options.getSubcommand();
		const lookupType = options.getString('type');
		const lookupName = options.getString('name');

		await interaction.deferReply();
		const warframeName = (lookupName || '').trim();
		const itemName = (lookupName || '').trim();

		const truncate = (s: string | undefined, n = 1024) => {
			if (!s) return '';
			return s.length > n ? s.slice(0, n - 3) + '...' : s;
		};

		try {
			switch (subcommand) {
				case 'about':
					await interaction.editReply({ content: 'Warframe is a fast-paced, cooperative third-person action game set in a sci‑fi universe where you play as the Tenno — ancient warriors in powered suits called Warframes. Gameplay mixes fluid parkour movement and ability-driven combat with loot, crafting, and progression: you collect blueprints and components (often from mission drops or relics), build weapons/frames, and upgrade them with mods. Missions vary from short PvE objectives to open-world zones, space combat (Railjack), and large-scale events; the game emphasizes cooperative play and a steady stream of live updates and new content. The story and worldbuilding are deep and evolving, with multiple factions, lore threads, and seasonal/prime vault mechanics that keep the meta shifting.' });
					break;

				case 'lore':
					const warframeURL = 'https://warframe.com/landing';
					await interaction.editReply({
						content: `Warframe’s lore is a layered sci‑fi myth about identity, loss, and rebellion. You play as the Tenno — children mysteriously changed by exposure to the Void aboard the lost Zariman vessel — who control powerful biomechanical suits called Warframes. Long before the present, the Orokin empire ruled the System with advanced tech and decadent power; they created Warframes (and later the robotic Sentients) and fell to their own hubris. After a cataclysmic revolt and the Sentient threat, the Tenno went dormant in stasis until awakened to fight again.
										
					Key factions shape the world: the militarized, cloned Grineer; the profit‑driven Corpus; the parasitic Infested; and the adaptive Sentients. Central characters and revelations — notably in quests like The Second Dream, The War Within, and The Sacrifice — expose the Tenno’s true nature, the Lotus’s hidden origins, and ethical costs of Orokin-era experiments. Themes focus on memory, agency, and what it means to be human (or post‑human), with ongoing storylines delivered through cinematic quests, events, and seasonal updates. ${warframeURL}`
					});
					break;

				case 'mr':
					const ps4WFRank = 22;
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
					switch ((lookupType || '').toLowerCase()) {
						case 'warframe':
							const warframeUrl = `https://api.warframestat.us/warframes/search/${encodeURIComponent(warframeName)}`;
							const response = await axios.get(warframeUrl);
							const raw = response.data;
							const data = Array.isArray(raw) ? raw : (raw ? [raw] : []);

							if (!data || data.length === 0) {
								return interaction.editReply({ content: `No Warframe found with the name "${warframeName}"` });
							}

							const warframeData: WarframeData = data[0];

							// Create component fields with appropriate display for Prime vs non-Prime
							const componentFields = await Promise.all(warframeData.components.map(async (component) => {
								let drops: Drops[] = component.drops || [];
								let fallbackItemUrl: string | undefined = undefined;

								// If drops are empty, attempt a fallback lookup against the items API
								if (!drops || drops.length === 0) {
									try {
										const itemUrl = `https://api.warframestat.us/items/search/${encodeURIComponent(component.name)}`;
										const itemResp = await axios.get(itemUrl);
										const itemData: ItemResponse[] = itemResp.data;
										if (itemData && itemData.length > 0) {
											const fallback = itemData[0];
											if (fallback.drops && fallback.drops.length > 0) {
												drops = fallback.drops;
												fallbackItemUrl = (fallback.wikiaUrl || fallback.wikiaThumbnail) as string | undefined;
											} else {

												fallbackItemUrl = (fallback.wikiaUrl || fallback.wikiaThumbnail) as string | undefined;
											}
										} else {
											// no results from items endpoint
										}
									} catch (e) {
										logError('[warframe] Failed to fetch item fallback for', { component: component.name, error: (e as Error)?.message ?? e });
									}
								}

								const hasDrops = Array.isArray(drops) && drops.length > 0;

								let dropsText = '';

								if (warframeData.isPrime) {
									if (!hasDrops) {
										// No drops available even after fallback; provide a helpful suggestion
										dropsText = fallbackItemUrl
											? `No drop data available from API. Try item lookup: ${fallbackItemUrl}`
											: `No drop data available from API. Try: /warframe lookup item ${component.name}`;
									} else {
										// Prime component display
										dropsText = drops.map(drop => {
											return `Relic: ${drop.location}\nRarity: ${drop.rarity}\nChance: ${drop.chance.toFixed(2)}%`;
										}).join('\n\n');
									}

									const fieldName = `${component.name} ${component.ducats ? `(${component.ducats} ducats)` : ''}`;
									let fieldValue = `Tradable: ${component.tradable ? 'Yes' : 'No'}\nDrops:\n${dropsText}`;
									if (fieldValue.length > 1024) {
										const ref = fallbackItemUrl ? `See: ${fallbackItemUrl}` : `Try: /warframe lookup item ${component.name}`;
										const allowed = 1024 - (ref.length + 5);
										fieldValue = fieldValue.slice(0, Math.max(0, allowed)) + '...\n' + ref;
									}

									return { name: fieldName, value: fieldValue, inline: false };
								} else {
									// Debug: log raw drops payload for non-Prime components (after fallback)
									// (debug logs removed)

									if (!hasDrops) {
										// No drops available even after fallback; provide a helpful suggestion
										dropsText = fallbackItemUrl
											? `No drop data available from API. Try item lookup: ${fallbackItemUrl}`
											: `No drop data available from API. Try: /warframe lookup item ${component.name}`;
									} else {
										// Non-Prime component display
										dropsText = drops.map(drop => {
											return `${drop.location} (${drop.rarity}, ${drop.chance.toFixed(2)}%)`;
										}).join('\n');
									}

									const fieldName = component.name;
									let fieldValue = `Tradable: ${component.tradable ? 'Yes' : 'No'}\nDrops:\n${dropsText}`;
									if (fieldValue.length > 1024) {
										const ref = fallbackItemUrl ? `See: ${fallbackItemUrl}` : `Try: /warframe lookup item ${component.name}`;
										const allowed = 1024 - (ref.length + 5);
										fieldValue = fieldValue.slice(0, Math.max(0, allowed)) + '...\n' + ref;
									}

									return { name: fieldName, value: fieldValue, inline: false };
								}
							}));

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
								// imageName from API is a filename; construct CDN URL. Fall back to wikiaThumbnail or placeholder.
								.setThumbnail(warframeData.imageName ? `https://cdn.warframestat.us/img/${warframeData.imageName}` : (warframeData.wikiaThumbnail || 'https://via.placeholder.com/150'))
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
										value: truncate(ability.description, 1024) || 'No description',
										inline: false
									}))
								);
							}

							// Send the embed
							await interaction.editReply({ embeds: [warframeEmbed] });
							break;
						case 'item':
							try {
								const itemUrl = `https://api.warframestat.us/items/search/${encodeURIComponent(itemName)}`;
								const itemResponse = await axios.get(itemUrl);
								const rawItem = itemResponse.data;
								const itemData: ItemResponse[] = Array.isArray(rawItem) ? rawItem : (rawItem ? [rawItem] : []);

								if (!itemData || itemData.length === 0) {
									return interaction.editReply({ content: `No item found with the name "${itemName}"` });
								}

								const firstItem = itemData[0];

								const fields: { name: string; value: string }[] = [];

								const maybeWithComponents = firstItem as unknown as { components?: Components[] };
								if (maybeWithComponents.components && Array.isArray(maybeWithComponents.components) && maybeWithComponents.components.length > 0) {
									const componentsArray = maybeWithComponents.components;

									componentsArray.forEach((component: Components, index: number) => {
										fields.push({
											name: `Recipe Item ${index + 1}`,
											value: `Name: ${component.name}\nDescription: ${truncate(component.description, 1024)}\nItem Count: ${component.itemCount}\n`
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
									.setDescription(truncate(firstItem.description, 2048) || 'No description')
									.addFields([
										{
											name: 'Category',
											value: firstItem.category || 'Unknown'
										},
										{
											name: 'Type',
											value: firstItem.type || 'Unknown'
										},
										{
											name: 'Tradable',
											value: firstItem.tradable ? 'Yes' : 'No'
										}
									])
									.addFields(fields)
									.setColor('Green')
									.setThumbnail(firstItem.imageName ? `https://cdn.warframestat.us/img/${firstItem.imageName}` : (firstItem.wikiaThumbnail || 'https://via.placeholder.com/150'))
									.setTimestamp();

								await interaction.editReply({ embeds: [itemEmbed] });
							} catch (error) {
								logError('warframe item lookup error', { error: (error as Error)?.message ?? error });
								await interaction.editReply({ content: 'An error occurred while fetching item data.' });
							}
							break;

						default:
							return interaction.editReply({ content: 'Invalid lookup type. Use "warframe" or "item".' });
					}
			}
		} catch (error) {
			logError('warframe command failed', { error: (error as Error)?.message ?? error });
			await interaction.reply({ content: 'An error occurred while processing the points. Please try again later.', flags: MessageFlags.Ephemeral });
		}
	},
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