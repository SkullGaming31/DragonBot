import { ApplicationCommandOptionType, ApplicationCommandType, channelMention, EmbedBuilder, MessageFlags, userMention } from 'discord.js';
import { randomInt } from 'node:crypto';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { IUser, UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

// Cache types mirroring Vigor's progression
const CACHE_TIERS = {
	COMMON: {
		name: 'Common Cache',
		chance: 0.6,
		rewards: {
			gold: [100, 200] as [number, number]
		},
		// image: 'common-cache.png'
	},
	MILITARY: {
		name: 'Military Crate',
		chance: 0.3,
		rewards: {
			gold: [250, 500] as [number, number]
		},
		// image: 'military-crate.png'
	},
	LUXURY: {
		name: 'Luxury Case',
		chance: 0.1,
		rewards: {
			gold: [750, 1500] as [number, number]
		},
		// image: 'luxury-case.png'
	}
};

export default new Command({
	name: 'dig',
	description: 'Scavenge for supply caches - Vigor style!',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	Cooldown: 21600000, // 6 hours
	Category: 'Fun',
	options: [
		{
			name: 'location',
			description: 'Choose your digging zone',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{ name: 'Forest (Safe)', value: 'forest' },
				{ name: 'Ruins (Risky)', value: 'ruins' },
				{ name: 'Radiation Zone (Dangerous)', value: 'radiation' }
			]
		}
	],
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		try {
			const { options, user, channel, guild } = interaction;

			const zone = options.getString('location') as 'forest' | 'ruins' | 'radiation';

			// Validate environment
			const settings = await SettingsModel.findOne({ GuildID: guild?.id });
			const economyChannel = settings?.EconChan ? guild?.channels.cache.get(settings.EconChan) : interaction.channel;
			if (!economyChannel) {
				return interaction.reply({
					content: '❌ Economy system not properly configured!',
					flags: MessageFlags.Ephemeral
				});
			}

			if (channel?.id !== economyChannel?.id) {
				return interaction.reply({
					content: `${userMention(user.id)}, Scavenge operations restricted to ${channelMention(economyChannel?.id)}`,
					flags: MessageFlags.Ephemeral
				});
			}

			// Get player profile
			const userDoc = await UserModel.findOne<IUser>({
				guildID: guild?.id,
				id: user.id
			});

			const now = Date.now();
			const cooldownEnd = userDoc?.cooldowns?.dig || 0;

			if (now < cooldownEnd) {
				const remaining = cooldownEnd - now;
				const hours = Math.floor(remaining / 3600000);
				const minutes = Math.floor((remaining % 3600000) / 60000);

				return interaction.reply({
					content: `⏳ You need to let your team rest! Come back in \`${hours}h ${minutes}m\``,
					flags: MessageFlags.Ephemeral
				});
			}

			// Zone-specific modifiers
			let tierModifier = 1;
			if (zone === 'ruins') tierModifier = 1.3;
			if (zone === 'radiation') tierModifier = 1.7;

			// Determine found cache
			const roll = Math.random();
			let foundTier;

			if (roll < CACHE_TIERS.LUXURY.chance * tierModifier) {
				foundTier = CACHE_TIERS.LUXURY;
			} else if (roll < CACHE_TIERS.MILITARY.chance * tierModifier) {
				foundTier = CACHE_TIERS.MILITARY;
			} else {
				foundTier = CACHE_TIERS.COMMON;
			}

			// Generate loot
			const loot = {
				gold: randomInt(...foundTier.rewards.gold)
			};

			// Update inventory
			await UserModel.updateOne(
				{ guildID: guild?.id, id: user.id },
				{
					$inc: { balance: loot.gold },
					$set: { 'cooldowns.dig': Date.now() + 21600000 } // 6 hours
				},
				{ upsert: true }
			);

			// Build response
			const locationMessages = {
				forest: ['Peaceful woodland foraging', 'Quiet forest scavenging'],
				ruins: ['Urban ruin exploration', 'Abandoned building search'],
				radiation: ['Hot zone excavation', 'Glowing crater digging']
			};

			// Helper function inside the command
			function createProgressBar(current: number, max: number): string {
				const filledBlocks = Math.round((current / max) * 10);
				return `[${'◼'.repeat(filledBlocks)}${'◻'.repeat(10 - filledBlocks)}]`;
			}

			// Flavor text variations
			const findVerbs = [
				'Unearthed', 'Discovered', 'Excavated',
				'Uncovered', 'Secured', 'Salvaged',
				'Retrieved', 'Reclaimed', 'Exhumed',
				'Recovered'
			];

			// Inside your command handler after determining foundTier
			const verb = findVerbs[Math.floor(Math.random() * findVerbs.length)];
			const maxPossibleGold = CACHE_TIERS.LUXURY.rewards.gold[1];

			const embed = new EmbedBuilder()
				.setColor(
					foundTier === CACHE_TIERS.LUXURY ? '#ffd700' :
						foundTier === CACHE_TIERS.MILITARY ? '#c0c0c0' :
							'#2ecc71' // Common tier color
				)
				.setTitle(`${zone.toUpperCase()} OPERATION`)
				.setDescription(
					`**${verb}:** ${foundTier.name}\n\n` +
					`💰 **Gold Found:** ${loot.gold.toLocaleString()}\n` +
					`📊 **Yield Quality:** ${createProgressBar(loot.gold, maxPossibleGold)}\n\n` +
					'⏳ Next scavenge available in 6 hours'
				)
				.addFields({
					name: 'Zone Modifiers',
					value: zone === 'radiation' ? '☢️ High Risk/High Reward' :
						zone === 'ruins' ? '🏚️ Moderate Risk' :
							'🌳 Low Risk',
					inline: true
				})
				// .setImage(`attachment://${foundTier.image}`)
				.setFooter({
					text: `Total Balance: ${((userDoc?.balance || 0) + loot.gold).toLocaleString()}g`,
					iconURL: user.displayAvatarURL()
				});

			return interaction.reply({
				content: `🏕️ ${locationMessages[zone][Math.floor(Math.random() * locationMessages[zone].length)]}`,
				embeds: [embed],
				// files: [attachment]
			});

		} catch (error) {
			console.error('Dig Command Error:', error);
			await interaction.reply({
				content: '⚠️ Equipment failure - scavenge aborted',
				ephemeral: true
			});
		}
	}
});