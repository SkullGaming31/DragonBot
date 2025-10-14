import { randomInt } from 'crypto';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, channelMention, MessageFlags } from 'discord.js';
import RouletteModel from '../../Database/Schemas/rouletteDB';

// Random choice helper function
function randomChoice<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export default new Command({
	name: 'roulette',
	description: 'Play a high-stakes game of Russian roulette!',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	Category: 'Fun',
	Cooldown: 60000,
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'bet',
			description: 'Amount of gold to bet',
			type: ApplicationCommandOptionType.Integer,
			required: true,
			min_value: 100
		}
	],
	run: async ({ interaction }) => {
		const { user, guild, channel } = interaction;
		if (!user) return interaction.reply({ content: 'User not found!', flags: MessageFlags.Ephemeral });

		// if (user.id === guild?.ownerId) return interaction.reply({ content: 'Sorry I cannot timeout the owner of the guild', flags: MessageFlags.Ephemeral });

		const settingsDoc = await SettingsModel.findOne({ GuildID: guild?.id });
		if (!settingsDoc) return interaction.reply({ content: 'Settings not found!', flags: MessageFlags.Ephemeral });
		if (settingsDoc.EconChan === undefined) return;

		const Economychannel = guild?.channels.cache.get(settingsDoc.EconChan);

		if (!Economychannel || channel?.id !== settingsDoc.EconChan) {
			return interaction.reply({
				content: `Please use this command in the designated economy channel: ${channelMention(settingsDoc.EconChan)}`,
				flags: MessageFlags.Ephemeral
			});
		}
		let userDoc = await UserModel.findOne({ guildID: guild?.id, username: user.username });
		if (!userDoc) {
			// Create a new user document if it doesn't exist
			// console.log('Creating new user document');
			userDoc = new UserModel({
				id: user.id,
				guildID: guild?.id,
				username: user.username, // Ensure the username is set
				balance: 0 // Initialize balance
			});
			await userDoc.save().catch(err => console.error('Error saving user document:', err));
		} else {
			// Log the found user document
			// console.log('User document found:', userDoc);
		}

		// Get and validate bet amount
		const rawBet = interaction.options.getInteger('bet', true);
		const betAmount = Math.abs(rawBet);
		const minBet = 100;
		const maxBet = 12000;

		// Validate bet amount
		if (betAmount < minBet || betAmount > maxBet || typeof betAmount !== 'number') {
			return interaction.reply({
				content: `Bet must be between ${minBet} and ${maxBet} gold!`,
				ephemeral: true
			});
		}

		if (userDoc.balance < betAmount) {
			return interaction.reply({
				content: `❌ Insufficient funds! You need ${betAmount - userDoc.balance} more gold.`,
				ephemeral: true
			});
		}

		const rouletteDoc = await RouletteModel.findOne({ GuildID: guild?.id }) ||
			await RouletteModel.create({ GuildID: guild?.id });

		// Improved bullet calculation
		const bulletIncrement = 2000; // Every $2000 adds 1 bullet
		const additionalBullets = Math.floor(betAmount / bulletIncrement);
		let totalBullets = 1 + Math.min(additionalBullets, 4); // Cap at 5 bullets total
		let highRollerBonus = 1;

		// Max bet handling
		if (betAmount === maxBet) {
			totalBullets = 5; // 5/6 chambers loaded
			highRollerBonus = 1.5; // 50% bonus
		}

		// Chamber setup
		const chamber = Array(6).fill('🔘');
		const bulletPositions = new Set<number>();
		while (bulletPositions.size < totalBullets) {
			bulletPositions.add(randomInt(0, 5));
		}

		// Animated spin
		await interaction.deferReply();
		for (const msg of [
			'🔫 Spinning the chamber...',
			'🔫 Chamber spinning ▰▱▱',
			'🔫 Chamber spinning ▰▰▱',
			'🔫 Chamber spinning ▰▰▰'
		]) {
			await interaction.editReply(msg);
			await new Promise(resolve => setTimeout(resolve, 800));
		}

		// Determine outcome
		const chamberPosition = randomInt(0, 5);
		const isFatal = bulletPositions.has(chamberPosition);

		// Update chamber display
		bulletPositions.forEach(pos => chamber[pos] = '💀');
		chamber[chamberPosition] = isFatal ? '💥' : '💰';

		// Calculate rewards
		const baseMultiplier = 1 + (totalBullets * 0.6);
		const winMultiplier = baseMultiplier * highRollerBonus;
		// const winnings = Math.round(betAmount * winMultiplier);

		// Build embed
		const embed = new EmbedBuilder()
			.setTitle(`${user.username}'s Russian Roulette`)
			.setColor(isFatal ? 0xFF0000 : 0x00FF00)
			.setDescription([
				`**Chamber:** ${chamber.join(' ')}`,
				`**Bet:** ${betAmount} gold`,
				`**Bullets:** ${totalBullets}/6 (${Math.round((totalBullets / 6) * 100)}% risk)`,
				`**Multiplier:** ${winMultiplier.toFixed(1)}x`
			].join('\n'));

		if (isFatal) {
			userDoc.balance -= betAmount;
			rouletteDoc.jackpot += betAmount; // Add lost bet to jackpot
			rouletteDoc.streak = 0;
			embed.addFields({
				name: '💥 BOOM! 💥',
				value: [
					`Lost ${betAmount} gold!`,
					`💎 Jackpot increased to ${rouletteDoc.jackpot.toLocaleString()} gold!`,
					randomChoice([
						'The roulette gods demand sacrifice!',
						'Better luck next time!',
						'Death claims another victim!'
					])
				].join('\n')
			});
		} else {
			// Win condition with jackpot chance
			let jackpotWon = false;
			let jackpotAmount = 0;

			// 1% chance to win jackpot
			if (Math.random() < 0.01 && rouletteDoc.jackpot > 0) {
				jackpotAmount = rouletteDoc.jackpot;
				rouletteDoc.jackpot = 100;
				jackpotWon = true;
			}

			// Calculate regular winnings
			const baseMultiplier = 1 + (totalBullets * 0.6);
			const winMultiplier = baseMultiplier * highRollerBonus;
			let winnings = Math.round(betAmount * winMultiplier);

			// Add jackpot if won
			if (jackpotWon) {
				winnings += jackpotAmount;
				embed.addFields({
					name: '🎰 JACKPOT WIN! 🎰',
					value: `**1% LUCK!** Won ${jackpotAmount.toLocaleString()} gold! (Jackpot resets to 100)`,
					inline: true
				});
			}

			userDoc.balance += winnings;
			rouletteDoc.streak = (rouletteDoc.streak || 0) + 1;

			// Streak bonus
			const streakBonus = Math.min(rouletteDoc.streak * 0.1, 1.0);
			userDoc.balance += Math.round(winnings * streakBonus);

			embed.addFields({
				name: '🎉 Victory! 🎉',

				value: [
					`Won ${winnings} gold!`,
					jackpotWon ? '(Includes jackpot!)' : '',
					streakBonus > 0 && `+${Math.round(streakBonus * 100)}% streak bonus`,
					randomChoice([
						'Lady Luck smiles upon you!',
						'The bullets were blanks!',
						'Death takes a holiday!'
					])
				].filter(Boolean).join('\n')
			});

			// Max bet bonus display
			if (betAmount === maxBet) {
				embed.addFields({
					name: '🎩 High Roller Bonus 🎩',
					value: '+50% reward multiplier!',
					inline: true
				});
			}
		}

		// Save changes
		await Promise.all([userDoc.save(), rouletteDoc.save()]);
		await interaction.editReply({ embeds: [embed] });
	},
});