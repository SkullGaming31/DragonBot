/**
 * remote: warning: See https://gh.io/lfs for more information.
	 remote: warning: File src/TFD_metadata/nexon_reactor.json is 50.13 MB; this is larger than GitHub's recommended maximum file size of 50.00 MB
	 remote: warning: GH001: Large files detected. You may want to try Git Large File Storage - https://git-lfs.github.com.
	*
 */

import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder } from 'discord.js';
import { Command } from '../../Structures/Command';
import axios from 'axios';
import tfd from '../../Database/Schemas/tfd_ouid';
import fs from 'fs';
import path from 'path';

// Load the JSON files
const moduleDataPath = path.join(__dirname, '../../TFD_metadata', 'nexon_module.json');
const moduleData = JSON.parse(fs.readFileSync(moduleDataPath, 'utf-8'));

const descendantDataPath = path.join(__dirname, '../../TFD_metadata', 'nexon_decendents.json');
const descendantData = JSON.parse(fs.readFileSync(descendantDataPath, 'utf-8'));

const weaponDataPath = path.join(__dirname, '../../TFD_metadata', 'nexon_weapon.json');
const weaponData = JSON.parse(fs.readFileSync(weaponDataPath, 'utf-8'));

const reactorDataPath = path.join(__dirname, '../../TFD_metadata', 'nexon_reactor.json');
const reactorData = JSON.parse(fs.readFileSync(reactorDataPath, 'utf-8'));

const externalComponentDataPath = path.join(__dirname, '../../TFD_metadata', 'nexon_external-component.json');
const externalComponentData = JSON.parse(fs.readFileSync(externalComponentDataPath, 'utf-8'));

const voidBattlePath = path.join(__dirname, '../../TFD_metadata', 'nexon_void-battle.json');
const voidBattleData = JSON.parse(fs.readFileSync(voidBattlePath, 'utf-8'));

// Function to get module name by ID
function getModuleNameById(id: string): string {
	const module = moduleData.find((mod: { module_id: string; module_name: string }) => mod.module_id === id);
	return module ? module.module_name : 'Unknown Module';
}

// Function to get descendant name by ID
function getDescendantNameById(id: string): string {
	const descendant = descendantData.find((desc: { descendant_id: string; descendant_name: string }) => desc.descendant_id === id);
	return descendant ? descendant.descendant_name : 'Unknown Descendant';
}

// Function to get weapon name by ID
function getWeaponNameById(id: string): string {
	const weapon = weaponData.find((wep: { weapon_id: string; weapon_name: string }) => wep.weapon_id === id);
	return weapon ? weapon.weapon_name : 'Unknown Weapon';
}
// Function to get weapon ID by name
function getWeaponIdByName(name: string): string {
	const weapon = weaponData.find((wep: { weapon_id: string; weapon_name: string }) => wep.weapon_name.toLowerCase() === name.toLowerCase());
	return weapon ? weapon.weapon_id : 'Unknown Weapon';
}
// Function to get weapon name by ID
function getReactorNameById(id: string): string {
	const reactor = reactorData.find((rea: { reactor_id: string; reactor_name: string }) => rea.reactor_id === id);
	return reactor ? reactor.reactor_name : 'Unknown Reactor';
}

// Function to get weapon name by ID
function getExternalComponentNameById(id: string): string {
	const externalcomponent = externalComponentData.find((ec: { external_component_id: string; external_component_name: string }) => ec.external_component_id === id);
	return externalcomponent ? externalcomponent.external_component_name : 'Unknown External Component';
}

function getVoidBattleNameById(id: string): string {
	const voidBattle = voidBattleData.find((vb: { void_battle_id: string; void_battle_name: string }) => vb.void_battle_id === id);
	return voidBattle ? voidBattle.void_battle_name : 'Unknown Void Battle Boss';
}

export const nexonApi = axios.create({
	baseURL: 'https://open.api.nexon.com/tfd/v1',
	headers: {
		'X-NXOPEN-API-KEY': process.env.NEXON_API_KEY,
		'Accept': 'application/json',
	},
});

// Define the type for the module
interface Module {
	module_slot_id: string;
	module_id: string;
	module_enchant_level: number;
}

// Define the type for the descendant
interface Descendant {
	descendant_id: string;
	descendant_name: string;
}

// Define the type for the weapon
interface Weapon {
	module_max_capacity: number;
	module_capacity: number;
	weapon_slot_id: string;
	weapon_id: string;
	weapon_level: number;
	perk_ability_enchant_level: number;
	weapon_additional_stat: Array<{ additional_stat_name: string; additional_stat_value: string }>;
	module: Array<Module>;
}

interface ReactorAdditionalStat {
	additional_stat_name: string;
	additional_stat_value: string;
}

interface Reactor {
	reactor_id: string;
	reactor_slot_id: string;
	reactor_level: number;
	reactor_additional_stat: ReactorAdditionalStat[];
	reactor_enchant_level: number;
}

interface ExternalComponentAdditionalStat {
	additional_stat_name: string;
	additional_stat_value: string;
}

interface ExternalComponent {
	external_component_slot_id: string;
	external_component_id: string;
	external_component_level: number;
	external_component_additional_stat: ExternalComponentAdditionalStat[];
}

interface ExternalComponentResponse {
	ouid: string;
	user_name: string;
	external_component: ExternalComponent[];
}

interface Descendants {
	id: string;
	name: string;
}

const descendantsList: Descendants[] = [
	{ id: '101000002', name: 'ajax' },
	{ id: '101000007', name: 'ultimate ajax' },
	{ id: '101000001', name: 'lepic' },
	{ id: '101000004', name: 'ultimate lepic' },
	{ id: '101000012', name: 'blair' },
	{ id: '101000009', name: 'gley' },
	{ id: '101000020', name: 'ultimate gley' },
	{ id: '101000006', name: 'bunny' },
	{ id: '101000019', name: 'ultimate bunny' },
	{ id: '101000014', name: 'kyle' },
	{ id: '101000011', name: 'sharen' },
	{ id: '101000013', name: 'valby' },
	{ id: '101000022', name: 'ultimate valby' },
	{ id: '101000003', name: 'viessa' },
	{ id: '101000010', name: 'ultimate viessa' },
	{ id: '101000021', name: 'hailey' },
	{ id: '101000005', name: 'jayber' },
	{ id: '101000015', name: 'esiemo' },
	{ id: '101000016', name: 'enzo' },
	{ id: '101000017', name: 'yujin' },
	{ id: '101000018', name: 'luna' },
	{ id: '101000008', name: 'freyna' }
];

export default new Command({
	name: 'nexon',
	description: 'Nexon API related commands',
	UserPerms: ['ManageGuild'],
	BotPerms: ['ManageGuild'],
	defaultMemberPermissions: ['ManageGuild'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'get-ouid',
			description: 'Fetch and store the OUID using your Nexon username',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'user_name',
					description: 'Your Nexon assigned name',
					type: ApplicationCommandOptionType.String,
					required: true,
				},
			],
		},
		{
			name: 'get-user-info',
			description: 'Fetch user info using the stored OUID',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'user_name',
					description: 'Your Nexon assigned name',
					type: ApplicationCommandOptionType.String,
					required: true,
				},
			],
		},
		{
			name: 'get-user-descendant',
			description: 'Fetch user descendant info using the stored OUID',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'user_name',
					description: 'Your Nexon assigned name',
					type: ApplicationCommandOptionType.String,
					required: true,
				},
			],
		},
		{
			name: 'get-user-weapon',
			description: 'Fetch user weapon info using the stored OUID',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'user_name',
					description: 'Your Nexon assigned name',
					type: ApplicationCommandOptionType.String,
					required: true,
				},
				{
					name: 'language_code',
					description: 'The Language you want the message to be in',
					type: ApplicationCommandOptionType.String,
					required: true,
					choices: [
						{ name: 'en', value: 'en' },
						{ name: 'ko', value: 'ko' },
						{ name: 'de', value: 'de' },
						{ name: 'fr', value: 'fr' },
						{ name: 'ja', value: 'ja' },
						{ name: 'zh-CN', value: 'zh-CN' },
						{ name: 'zh-TW', value: 'zh-TW' },
						{ name: 'it', value: 'it' },
						{ name: 'pl', value: 'pl' },
						{ name: 'pt', value: 'pt' },
						{ name: 'ru', value: 'ru' },
						{ name: 'es', value: 'es' }
					]
				}
			],
		},
		{
			name: 'get-user-reactor',
			description: 'Fetch user reactor info using the stored OUID',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'user_name',
					description: 'Your Nexon assigned name',
					type: ApplicationCommandOptionType.String,
					required: true,
				},
				{
					name: 'language_code',
					description: 'The Language you want the message to be in',
					type: ApplicationCommandOptionType.String,
					required: true,
					choices: [
						{ name: 'en', value: 'en' },
						{ name: 'ko', value: 'ko' },
						{ name: 'de', value: 'de' },
						{ name: 'fr', value: 'fr' },
						{ name: 'ja', value: 'ja' },
						{ name: 'zh-CN', value: 'zh-CN' },
						{ name: 'zh-TW', value: 'zh-TW' },
						{ name: 'it', value: 'it' },
						{ name: 'pl', value: 'pl' },
						{ name: 'pt', value: 'pt' },
						{ name: 'ru', value: 'ru' },
						{ name: 'es', value: 'es' }
					]
				}
			],
		},
		{
			name: 'get-user-ec',
			description: 'Fetch user external components info using the stored OUID',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'user_name',
					description: 'Your Nexon assigned name',
					type: ApplicationCommandOptionType.String,
					required: true,
				},
				{
					name: 'language_code',
					description: 'The Language you want the message to be in',
					type: ApplicationCommandOptionType.String,
					required: true,
					choices: [
						{ name: 'en', value: 'en' },
						{ name: 'ko', value: 'ko' },
						{ name: 'de', value: 'de' },
						{ name: 'fr', value: 'fr' },
						{ name: 'ja', value: 'ja' },
						{ name: 'zh-CN', value: 'zh-CN' },
						{ name: 'zh-TW', value: 'zh-TW' },
						{ name: 'it', value: 'it' },
						{ name: 'pl', value: 'pl' },
						{ name: 'pt', value: 'pt' },
						{ name: 'ru', value: 'ru' },
						{ name: 'es', value: 'es' }
					]
				}
			],
		},
		{
			name: 'get-module-rec',
			description: 'Get The reccomended modules for your weapon and descendant to take on the Void Intercept Boss Battle',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'descendants_name',
					description: 'The name of the descendant you plan on using!',
					type: ApplicationCommandOptionType.String,
					required: true,
					choices: [
						{ value: '101000002', name: 'ajax' },
						{ value: '101000007', name: 'ultimate ajax' },
						{ value: '101000001', name: 'lepic' },
						{ value: '101000004', name: 'ultimate lepic' },
						{ value: '101000012', name: 'blair' },
						{ value: '101000009', name: 'gley' },
						{ value: '101000020', name: 'ultimate gley' },
						{ value: '101000006', name: 'bunny' },
						{ value: '101000019', name: 'ultimate bunny' },
						{ value: '101000014', name: 'kyle' },
						{ value: '101000011', name: 'sharen' },
						{ value: '101000013', name: 'valby' },
						{ value: '101000022', name: 'ultimate valby' },
						{ value: '101000003', name: 'viessa' },
						{ value: '101000010', name: 'ultimate viessa' },
						{ value: '101000021', name: 'hailey' },
						{ value: '101000005', name: 'jayber' },
						{ value: '101000015', name: 'esiemo' },
						{ value: '101000016', name: 'enzo' },
						{ value: '101000017', name: 'yujin' },
						{ value: '101000018', name: 'luna' },
						{ value: '101000008', name: 'freyna' }
					]
				},
				{
					name: 'weapon_name',
					description: 'The name of the weapon you plan on using',
					type: ApplicationCommandOptionType.String,
					required: true
				},
				{
					name: 'void_intercept_battle',
					description: 'The Boss you want to take on in the void intercept battles.',
					type: ApplicationCommandOptionType.String,
					required: true,
					choices: [
						{ name: 'Grave Walker(Easy)', value: '651000001' },
						{ name: 'Stunning Beauty(Easy)', value: '651000002' },
						{ name: 'executioner(Easy)', value: '651000003' },
						{ name: 'dead_bride(Easy)', value: '651000004' },
						{ name: 'devourer(Easy)', value: '651000005' },
						{ name: 'pyromaniac(Easy)', value: '651000006' },
						{ name: 'swamp_walker(Easy)', value: '651000006' },
						{ name: 'hanged_man(Easy)', value: '651000008' },
						{ name: 'executioner(Hard)', value: '652000001' },
						{ name: 'dead_bride(Hard)', value: '652000002' },
						{ name: 'devourer(Hard)', value: '652000003' },
						{ name: 'pyromaniac(Hard)', value: '652000004' },
						{ name: 'swamp_walker(Hard)', value: '652000005' },
						{ name: 'obstructer(Hard)', value: '652000006' },
						{ name: 'frost_walker(Hard)', value: '652000007' },
						{ name: 'molten_fortress(Hard)', value: '652000008' },
						{ name: 'gluttony(Hard)', value: '652000009' },
					]
				},
				{
					name: 'period',
					description: 'Choose a period of time to search',
					type: ApplicationCommandOptionType.String,
					required: true,
					choices: [
						{ name: '7 Days', value: '0' },
						{ name: '30 Days', value: '1' },
						{ name: 'All Time', value: '2' },
					]
				}
			]
		}
	],
	// TODO: Add Difficulty Rewards from reward.JSON in a name searchable way.
	run: async ({ interaction }) => {
		const { options } = interaction;
		const subcommand = options.getSubcommand();
		const userName = options.getString('user_name');
		const Lang = options.getString('language_code');

		switch (subcommand) {
			case 'get-ouid':
				// Handle fetching and storing OUID
				try {
					let ouidEntry = await tfd.findOne({ username: userName });

					if (!ouidEntry) {
						const response = await nexonApi.get('/id', {
							params: { user_name: userName },
						});

						const ouid = response.data.ouid;

						ouidEntry = new tfd({ OUID: ouid, username: userName });
						await ouidEntry.save();

						await interaction.reply({ content: `OUID saved: ${ouid}`, ephemeral: true });
					} else {
						await interaction.reply({ content: `OUID already exists: ${ouidEntry.OUID}`, ephemeral: true });
					}
				} catch (error) {
					console.error('Error fetching OUID:', error);
					await interaction.reply({
						content: 'An error occurred while trying to retrieve the OUID.',
						ephemeral: true,
					});
				}
				break;
			case 'get-user-info':
				// Handle fetching user info
				try {
					const ouidEntry = await tfd.findOne({ username: userName });

					if (!ouidEntry) {
						return interaction.reply({
							content: `No OUID found for username: ${userName}. Please use the \`get-ouid\` command first.`,
							ephemeral: true,
						});
					}

					const userResponse = await nexonApi.get('/user/basic', {
						params: { ouid: ouidEntry.OUID },
					});

					const {
						ouid,
						user_name,
						platform_type,
						mastery_rank_level,
						mastery_rank_exp,
						title_prefix_id,
						title_suffix_id,
						os_language,
						game_language,
					} = userResponse.data;

					const userEmbed = new EmbedBuilder()
						.setTitle(`${user_name}'s User Info`)
						.setColor(0x1a73e8)
						.addFields(
							{ name: 'OUID', value: ouid, inline: true },
							{ name: 'Platform Type', value: platform_type, inline: true },
							{ name: 'Mastery Rank Level', value: mastery_rank_level.toString(), inline: true },
							{ name: 'Mastery Rank EXP', value: mastery_rank_exp.toString(), inline: true },
							{ name: 'Title Prefix ID', value: title_prefix_id || 'None', inline: true },
							{ name: 'Title Suffix ID', value: title_suffix_id || 'None', inline: true },
							{ name: 'OS Language', value: os_language, inline: true },
							{ name: 'Game Language', value: game_language, inline: true }
						)
						.setTimestamp();

					await interaction.reply({ embeds: [userEmbed], ephemeral: true });
				} catch (error) {
					console.error('Error fetching user data:', error);
					await interaction.reply({
						content: 'An error occurred while trying to retrieve the user data.',
						ephemeral: true,
					});
				}
				break;
			case 'get-user-descendant':
				// Handle fetching user descendant info
				try {
					const ouidEntry = await tfd.findOne({ username: userName });

					if (!ouidEntry) {
						return interaction.reply({
							content: `No OUID found for username: ${userName}. Please use the \`get-ouid\` command first.`,
							ephemeral: true,
						});
					}

					const descendantResponse = await nexonApi.get('/user/descendant', {
						params: { ouid: ouidEntry.OUID },
					});

					const {
						ouid,
						user_name,
						descendant_id,
						descendant_slot_id,
						descendant_level,
						module_max_capacity,
						module_capacity,
						module,
					} = descendantResponse.data;

					const descendantImageUrl = descendantData.find((desc: { descendant_id: string }) => desc.descendant_id === descendant_id)?.descendant_image_url || '';

					const descendantEmbed = new EmbedBuilder()
						.setTitle(`${user_name}'s Descendant Info`)
						.setImage(descendantImageUrl)
						.setColor(0x1a73e8)
						.addFields(
							{ name: 'OUID', value: ouid, inline: true },
							{ name: 'Descendant Name', value: getDescendantNameById(descendant_id), inline: true },
							{ name: 'Descendant Slot ID', value: descendant_slot_id || 'None', inline: true },
							{ name: 'Descendant Level', value: descendant_level.toString(), inline: true },
							{ name: 'Module Max Capacity', value: module_max_capacity.toString(), inline: true },
							{ name: 'Module Capacity', value: module_capacity.toString(), inline: true }
						)
						.addFields(
							module.length > 0
								? module.map((mod: Module) => ({
									name: `Module ${mod.module_slot_id}`,
									value: `Name: ${getModuleNameById(mod.module_id)}\nEnchantment Level: ${mod.module_enchant_level}`,
									inline: true,
								}))
								: { name: 'Modules', value: 'No modules equipped', inline: true }
						)
						.setTimestamp();

					await interaction.reply({ embeds: [descendantEmbed], ephemeral: true });
				} catch (error) {
					console.error('Error fetching user descendant data:', error);
					await interaction.reply({
						content: 'An error occurred while trying to retrieve the user descendant data.',
						ephemeral: true,
					});
				}
				break;
			case 'get-user-weapon':
				try {
					const ouidEntry = await tfd.findOne({ username: userName });

					if (!ouidEntry) {
						return interaction.reply({
							content: `No OUID found for username: ${userName}. Please use the \`get-ouid\` command first.`,
							ephemeral: true,
						});
					}

					const weaponResponse = await nexonApi.get('/user/weapon', {
						params: {
							ouid: ouidEntry.OUID,
							language_code: Lang
						},
					});

					const { weapon } = weaponResponse.data;

					// Split weapon data into chunks of 25 fields or less
					const chunks: EmbedBuilder[] = [];
					let currentEmbed = new EmbedBuilder()
						.setTitle(`${userName}'s Weapon Info`)
						.setColor(0x1a73e8);

					// Initialize the embed fields array
					let fields: any[] = [];

					weapon.forEach((weap: Weapon, index: number) => {
						const weaponFields = {
							name: `Weapon ${weap.weapon_slot_id}`,
							value: `Name: ${getWeaponNameById(weap.weapon_id)}\nLevel: ${weap.weapon_level}\n` +
								`Perk Ability Enchant Level: ${weap.perk_ability_enchant_level}\n` +
								`Module Max Capacity: ${weap.module_max_capacity}\n` +
								`Module Capacity: ${weap.module_capacity}\n` +
								`Additional Stats: ${weap.weapon_additional_stat.map(stat => `${stat.additional_stat_name}: ${stat.additional_stat_value}`).join(', ')}`,
							inline: true,
						};

						// Add field to current embed
						fields.push(weaponFields);

						// If 25 fields are reached, push the current embed and create a new one
						if (fields.length >= 25) {
							currentEmbed.addFields(fields);
							chunks.push(currentEmbed);
							currentEmbed = new EmbedBuilder()
								.setTitle(`${userName}'s Weapon Info (cont.)`)
								.setColor(0x1a73e8);
							fields = [];
						}
					});

					// Add remaining fields to the last embed
					if (fields.length > 0) {
						currentEmbed.addFields(fields);
						chunks.push(currentEmbed);
					}

					await interaction.reply({ embeds: chunks, ephemeral: true });
				} catch (error) {
					console.error('Error fetching user weapon data:', error);
					await interaction.reply({
						content: 'An error occurred while trying to retrieve the user weapon data.',
						ephemeral: true,
					});
				}
				break;
			case 'get-user-reactor':
				try {
					const ouidEntry = await tfd.findOne({ username: userName });

					if (!ouidEntry) {
						return interaction.reply({
							content: `No OUID found for username: ${userName}. Please use the \`get-ouid\` command first.`,
							ephemeral: true,
						});
					}

					const reactorResponse = await nexonApi.get('/user/reactor', {
						params: {
							ouid: ouidEntry.OUID,
							language_code: Lang
						},
					});

					const { reactor_id, reactor_slot_id, reactor_level, reactor_additional_stat, reactor_enchant_level } = reactorResponse.data;

					const reactorImageUrl = reactorData.find((rea: { reactor_id: string }) => rea.reactor_id === reactor_id)?.image_url || '';

					const reactorEmbed = new EmbedBuilder()
						.setTitle(`${userName}'s Reactor Info`)
						.setImage(reactorImageUrl)
						.setColor(0x1a73e8)
						.addFields(
							{ name: 'Reactor ID', value: reactor_id, inline: true },
							{ name: 'Reactor Name', value: getReactorNameById(reactor_id), inline: true },
							{ name: 'Reactor Slot ID', value: reactor_slot_id || 'None', inline: true },
							{ name: 'Reactor Level', value: reactor_level.toString(), inline: true },
							{ name: 'Reactor Enchant Level', value: reactor_enchant_level.toString(), inline: true },
							{
								name: 'Additional Stats', value: reactor_additional_stat.length > 0
									? reactor_additional_stat.map((stat: ReactorAdditionalStat) => `${stat.additional_stat_name}: ${stat.additional_stat_value}`).join('\n')
									: 'No additional stats', inline: false
							}
						)
						.setTimestamp();

					await interaction.reply({ embeds: [reactorEmbed], ephemeral: true });
				} catch (error) {
					console.error('Error fetching user reactor data:', error);
					await interaction.reply({
						content: 'An error occurred while trying to retrieve the user reactor data.',
						ephemeral: true,
					});
				}
				break;
			case 'get-user-ec':
				try {
					const ouidEntry = await tfd.findOne({ username: userName });

					if (!ouidEntry) {
						return interaction.reply({
							content: `No OUID found for username: ${userName}. Please use the \`get-ouid\` command first.`,
							ephemeral: true,
						});
					}

					const externalComponentResponse = await nexonApi.get('/user/external-component', {
						params: { ouid: ouidEntry.OUID, language_code: Lang },
					});

					const {
						external_component,
					}: ExternalComponentResponse = externalComponentResponse.data;

					const externalComponentEmbed = new EmbedBuilder()
						.setTitle(`${userName}'s External Components`)
						.setColor(0x1a73e8)
						.setTimestamp();

					external_component.forEach((component: ExternalComponent, index: number) => {
						externalComponentEmbed.addFields(
							{ name: `Component ${index + 1} - Slot ID`, value: component.external_component_slot_id, inline: true },
							{ name: 'Component Name', value: getExternalComponentNameById(component.external_component_id), inline: true },
							{ name: 'Component Level', value: component.external_component_level.toString(), inline: true },
							{
								name: 'Additional Stats', value: component.external_component_additional_stat.length > 0
									? component.external_component_additional_stat.map((stat: ExternalComponentAdditionalStat) => `${stat.additional_stat_name}: ${stat.additional_stat_value}`).join('\n')
									: 'No additional stats', inline: false
							}
						);
					});

					await interaction.reply({ embeds: [externalComponentEmbed], ephemeral: true });
				} catch (error) {
					console.error('Error fetching external component data:', error);
					await interaction.reply({
						content: 'An error occurred while trying to retrieve the external component data.',
						ephemeral: true,
					});
				}
				break;
			case 'get-module-rec':
				try {
					const descendantName = options.getString('descendants_name');
					const weaponName = options.getString('weapon_name');
					const voidBattleId = options.getString('void_intercept_battle');
					const period = options.getString('period');

					if (!voidBattleId || !weaponName || !descendantName) return;

					// Lookup weaponId using weaponName
					const weaponId = getWeaponIdByName(weaponName);

					if (!weaponId) {
						// Handle the case where the weapon name is invalid
						await interaction.reply({ content: `Weapon '${weaponName}' not found.`, ephemeral: true });
						return;
					}

					// make API request to get module recommendations
					const response = await nexonApi.get('/recommendation/module', {
						params: {
							descendant_id: descendantName,
							weapon_id: weaponId,
							void_battle_id: voidBattleId,
							period: period,
						},
					});

					// extract module recommendations for descendant and weapon
					const descendantRecommendations = response.data.descendant.recommendation;
					const weaponRecommendations = response.data.weapon.recommendation;

					const descendantImageUrl = descendantData.find((desc: { descendant_id: string }) => desc.descendant_id === descendantName)?.descendant_image_url || '';
					const weaponImageUrl = weaponData.find((wep: { weapon_id: string }) => wep.weapon_id === weaponId)?.image_url || '';

					// create embed for descendant module recommendations
					const descendantEmbed = new EmbedBuilder()
						.setTitle(`Recommended Modules for Descendant(${getDescendantNameById(descendantName)})`)
						.setImage(descendantImageUrl)
						.setColor(0x1a73e8);

					// add fields for each recommended module
					descendantRecommendations.forEach((recommendation: Module, index: number) => {
						const moduleName = getModuleNameById(recommendation.module_id); // replace with actual function to get module name
						descendantEmbed.addFields({ name: `Module ${index + 1}`, value: moduleName, inline: false });
					});

					// create embed for weapon module recommendations
					const weaponEmbed = new EmbedBuilder()
						.setTitle(`Recommended Modules for Weapon(${weaponName})`)
						.setImage(weaponImageUrl)
						.setColor(0x1a73e8);

					// add fields for each recommended module
					weaponRecommendations.forEach((recommendation: Module, index: number) => {
						const moduleName = getModuleNameById(recommendation.module_id); // replace with actual function to get module name
						weaponEmbed.addFields({ name: `Module ${index + 1}`, value: moduleName, inline: false });
					});

					// send both embeds as a reply to the user
					await interaction.reply({ content: `Recommended Modules for battling \`${getVoidBattleNameById(voidBattleId)}\``, embeds: [descendantEmbed, weaponEmbed], ephemeral: true });
				} catch (error: any) {
					if (error.isAxiosError) {
						console.error('Axios error:', error);
						// handle Axios error
					} else {
						console.error('Unknown error:', error);
						// handle other errors
					}
				}
				break;
			default:
				console.log('Issue Detected with nexon sub command');
				interaction.reply({ content: 'Issue detected with nexon sub commands', ephemeral: true });
				break;
		}
	},
});