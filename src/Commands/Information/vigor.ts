/* eslint-disable no-case-declarations */
import { ApplicationCommandOptionType, ApplicationCommandType, AttachmentBuilder, ColorResolvable, EmbedBuilder } from 'discord.js';
import * as fs from 'fs';
import { Command } from '../../Structures/Command';
import { sleep } from '../../Utilities/util';

interface Weapon {
	name: string;
	description: string;
	type: string;
	slot: string;
	quality: string;
	basedamage: number;
	rateoffire: number;
	muzzleSpeed: number;
	magsize: number;
	weight: number;
	firemode: string[];
	Misc: string[];
	folder: string;
}

interface Consumable {
	name: string;
	description: string;
	quality: string;
	health: number;
	stamina: number;
	weight: number;
	carry: number;
	folder: string;
}

interface Trap {
	name: string;
	description: string;
	quality: string;
	carry: number;
	folder: string;
}
interface Melee {
	name: string;
	type: string;
	slot: string;
	quality: string;
	basedamage: number;
	weight: number;
	folder: string;
}

interface Tools {
	name: string;
	description: string;
	quality: string;
	carry: number;
	folder: string;
}

interface Throwable {
	name: string;
	description: string;
	quality: string;
	carry: number;
	folder: string;
}

interface Item {
	weapon?: Weapon[];
	consumables?: Consumable[];
	tools: Tools[];
	traps?: Trap[];
	throwable: Throwable[];
	melee?: Melee[];
}

function getItemColor(quality: string): ColorResolvable {
	switch (quality) {
		case 'Common':
			return 'White';
		case 'Uncommon':
			return 'Green';
		case 'Rare':
			return 'Blue';
		case 'Military':
			return 'Purple';
		case 'Special Issue':
			return 'Gold';
		default:
			return 'Red';
	}
}

export default new Command({
	name: 'vigor',
	description: 'Information about the game Vigor',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	options: [
		{
			name: 'choice',
			description: 'which option would you like to look at?',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{
					name: 'about',
					value: 'about'
				},
				{
					name: 'lore',
					value: 'lore'
				},
				{
					name: 'item',
					value: 'item'
				},
			]
		},
		{
			name: 'name',
			description: 'What item are you looking for the stats for',
			type: ApplicationCommandOptionType.String,
			required: false
		}
	],
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		const { options, user } = interaction;
		await interaction.deferReply();
		try {
			const Choice = options.getString('choice');
			// const items: Item = JSON.parse(fs.readFileSync('./src/Item_Data.json', 'utf8'));
			switch (Choice) {
				case 'about':
					const vigorURL = 'https://vigorgame.com/about';
					const vigorEmbed = new EmbedBuilder()
						.setTitle('Vigor')
						.setDescription('Outlive the apocalypse. Vigor is a free-to-play looter shooter set in post-war Norway. LOOT, SHOOT BUILD Shoot and loot in tense encounters Build your shelter and vital equipment Challenge others in various game modes Play on your own or fight together with 2 of your other friends')
						.setURL(vigorURL)
						.setTimestamp();
					await interaction.editReply({ embeds: [vigorEmbed] });
					break;
				case 'lore':
					interaction.editReply({ content: 'theres no written lore for the game, its all recorded on tapes in the game itself, i will eventually, listen to them and write out what i can do describe the lore of the game as twitch messages can only be a max of 500 characters.' });
					break;
				case 'item':
					const itemName = options.getString('name');

					if (!itemName) { return interaction.editReply({ content: 'Please specify an item name.' }); }

					const items: Item = JSON.parse(fs.readFileSync('./src/Item_Data.json', 'utf8'));

					const weapons: Weapon[] = items.weapon || [];
					const consumables: Consumable[] = items.consumables || [];
					const traps: Trap[] = items.traps || [];
					const melees: Melee[] = items.melee || [];
					const tools: Tools[] = items.tools || [];
					const throwns: Throwable[] = items.throwable || [];

					const weapon = weapons.find((w: Weapon) => w.name.toLowerCase() === itemName.toLowerCase());
					const tool = tools.find((t: Tools) => t.name.toLowerCase() === itemName.toLowerCase());
					const trap = traps.find((tr: Trap) => tr.name.toLowerCase() === itemName.toLowerCase());
					const consumable = consumables.find((c: Consumable) => c.name.toLowerCase() === itemName.toLowerCase());
					const thrown = throwns.find((th: Throwable) => th.name.toLowerCase() === itemName.toLowerCase());
					const melee = melees.find((m: Melee) => m.name.toLowerCase() === itemName.toLowerCase());

					if (consumable) {// TODO: add image for the item Selected
						const imagePath = `../../../assets/images/${consumable.folder}/${consumable.name}.png`;
						const imageAttachment = new AttachmentBuilder(imagePath);
						const ConsumableEmbed = new EmbedBuilder()
							.setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ size: 512 }) })
							.setDescription(`Item stats for \`${consumable.name}\``)
							.addFields(
								{
									name: 'Description',
									value: consumable.description || 'No Description Added',
									inline: true
								},
								{
									name: 'Quality',
									value: consumable.quality || 'No Quality Added',
									inline: true
								},
								{
									name: consumable.health !== undefined ? 'Healing' : 'Stamina',
									value: `${consumable.health !== undefined ? consumable.health : consumable.stamina || 0}`,
									inline: true
								},
								{
									name: 'Carry',
									value: `${consumable.carry || 0}`,
									inline: false
								}
							)
							.setImage(`attachment://${consumable.name}.png`) // Set the image for the embed
							.setTimestamp();

						const itemColor = getItemColor(consumable.quality);
						ConsumableEmbed.setColor(itemColor);

						await interaction.editReply({ content: `Hold on 1 second, I will check the data for ${consumable.name}` });
						await sleep(1000);
						await interaction.editReply({ content: `${user}`, embeds: [ConsumableEmbed], files: [imageAttachment] });
					} else if (melee) {
						const imagePath = `../../../assets/images/${melee.folder}/${melee.name}.png`;
						const imageAttachment = new AttachmentBuilder(imagePath);
						const meleeEmbed = new EmbedBuilder()
							.setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ size: 512 }) })
							.setDescription(`Item stats for \`${melee.name}\``)
							.addFields(
								{
									name: 'type',
									value: melee.type || 'No type Added',
									inline: true
								},
								{
									name: 'Slot',
									value: melee.slot || 'No SLot Added',
									inline: true
								},
								{
									name: 'Quality',
									value: melee.quality || 'No Quality Added',
									inline: true
								},
								{
									name: 'Base Damage',
									value: `${melee.basedamage || 0}`,
									inline: false
								},
								{
									name: 'Weight',
									value: `${melee.weight || 0}`,
									inline: true
								}
							)
							.setTimestamp();

						const itemColor = getItemColor(melee.quality);
						meleeEmbed.setColor(itemColor);

						const tbd = await interaction.editReply({ content: `Hold on 1 second, I will check the data for ${melee.name}` });
						console.log(tbd.id);
						await sleep(1000);
						await interaction.editReply({ content: `${user}`, embeds: [meleeEmbed], files: [imageAttachment] });
					} else if (tool) {
						const imagePath = `../../../assets/images/${tool.folder}/${tool.name}.png`;
						const imageAttachment = new AttachmentBuilder(imagePath);
						const toolEmbed = new EmbedBuilder()
							.setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ size: 512 }) })
							.setDescription(`Item stats for \`${tool.name}\``)
							.addFields(
								{
									name: 'Description',
									value: tool.description || 'No Description Added',
									inline: true
								},
								{
									name: 'Quality',
									value: tool.quality || 'No Quality Added',
									inline: true
								},
								{
									name: 'Carry',
									value: `${tool.carry || 0}`,
									inline: true
								}
							)
							.setTimestamp();

						const itemColor = getItemColor(tool.quality);
						toolEmbed.setColor(itemColor);

						const tbd = await interaction.editReply({ content: `Hold on 1 second, I will check the data for ${tool.name}` });
						await sleep(1000);
						tbd.edit({ content: `${user}`, embeds: [toolEmbed], files: [imageAttachment] });
						// await interaction.editReply({ content: `${user}`, embeds: [toolEmbed] });
					} else if (trap) {
						const imagePath = `../../../assets/images/${trap.folder}/${trap.name}.png`;
						const imageAttachment = new AttachmentBuilder(imagePath);
						const trapEmbed = new EmbedBuilder()
							.setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ size: 512 }) })
							.setDescription(`Item stats for \`${trap.name}\``)
							.addFields(
								{
									name: 'Description',
									value: trap.description || 'No Description Added',
									inline: true
								},
								{
									name: 'Quality',
									value: trap.quality || 'No Quality Added',
									inline: true
								},
								{
									name: 'Carry',
									value: `${trap.carry || 0}`,
									inline: true
								}
							)
							.setTimestamp();

						const itemColor = getItemColor(trap.quality);
						trapEmbed.setColor(itemColor);

						await interaction.editReply({ content: `Hold on 1 second, I will check the data for ${trap.name}` });
						// await sleep(3000);
						// await interaction.deleteReply();
						await sleep(1000);
						await interaction.editReply({ content: `${user}`, embeds: [trapEmbed], files: [imageAttachment] });
					} else if (thrown) {
						const imagePath = `../../../assets/images/${thrown.folder}/${thrown.name}.png`;
						const imageAttachment = new AttachmentBuilder(imagePath);
						const thrownEmbed = new EmbedBuilder()
							.setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ size: 512 }) })
							.setDescription(`Item stats for \`${thrown.name}\``)
							.addFields(
								{
									name: 'Description',
									value: thrown.description || 'No Description Added',
									inline: true
								},
								{
									name: 'Quality',
									value: thrown.quality || 'No Quality Added',
									inline: true
								},
								{
									name: 'Carry',
									value: `${thrown.carry || 0}`,
									inline: true
								}
							)
							.setTimestamp();

						const itemColor = getItemColor(thrown.quality);
						thrownEmbed.setColor(itemColor);

						await interaction.editReply({ content: `Hold on 1 second, I will check the data for ${thrown.name}` });
						await sleep(1000);
						await interaction.editReply({ content: `${user}`, embeds: [thrownEmbed], files: [imageAttachment] });
					} else if (weapon) {
						const weaponEmbed = new EmbedBuilder()
							.setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ size: 512 }) })
							.setDescription(`Item stats for \`${weapon.name}\``)
							.addFields(
								{
									name: 'Type',
									value: weapon.type || 'No Type Added',
									inline: true
								},
								{
									name: 'Slot',
									value: weapon.slot || 'No Slot Added',
									inline: true
								},
								{
									name: 'Quality',
									value: `${weapon.quality || 0}`,
									inline: true
								},
								{
									name: 'Base Damage',
									value: `${weapon.basedamage || 0}`,
									inline: true
								},
								{
									name: 'Muzzle Speed',
									value: `${weapon.muzzleSpeed || 0}`,
									inline: true
								},
								{
									name: 'Fire Rate',
									value: `${weapon.rateoffire || 0}`,
									inline: true
								},
								{
									name: 'Magazine Size',
									value: `${weapon.magsize || 0}`,
									inline: true
								},
								{
									name: 'Fire Mode',
									value: weapon.firemode?.join(', ') || 'No Firemode Added',
									inline: true
								},
								{
									name: 'Misc',
									value: weapon.Misc?.join(', ') || 'No Misc Added',
									inline: true
								},
							)
							.setTimestamp();

						const itemColor = getItemColor(weapon.quality);
						weaponEmbed.setColor(itemColor);

						const weaponsResponse = await interaction.editReply({ content: `Hold on 1 second, I will check the data for ${weapon.name}` });
						await sleep(1000);
						if (weaponsResponse.editable) {
							weaponsResponse.edit({ content: `${user}`, embeds: [weaponEmbed] });
						} else {
							await interaction.editReply({ content: 'there was an error editing the weapon response embed' });
						}
						// await interaction.editReply({ content: `${user}`, embeds: [weaponEmbed] });
					} else {
						await interaction.editReply({ content: `Sorry, I could not find an item named "${itemName}".` });
					}
					break;
			}
		} catch (error) {
			console.error(error);
		}
	}
});