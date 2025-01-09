import { randomInt } from 'crypto'; // Import the randomInt function from the crypto module
import SettingsModel from '../../Database/Schemas/settingsDB';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';
import { ApplicationCommandType, EmbedBuilder, userMention, channelMention, MessageFlags } from 'discord.js';
import RouletteModel from '../../Database/Schemas/rouletteDB';

export default new Command({
	name: 'roulette',
	description: 'Play a game of Russian roulette!',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	Category: 'Fun',
	type: ApplicationCommandType.ChatInput,

	run: async ({ interaction }) => {
		const { user, guild, channel } = interaction;
		if (!user) return interaction.reply({ content: 'User not found!', flags: MessageFlags.Ephemeral });

		if (user.id === guild?.ownerId) return interaction.reply({ content: 'Sorry I cannot timeout the owner of the guild', flags: MessageFlags.Ephemeral });

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
			console.log('Creating new user document');
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

		let rouletteDoc = await RouletteModel.findOne({ GuildID: guild?.id });

		// Create a new roulette document if it doesn't exist
		if (!rouletteDoc) {
			rouletteDoc = await RouletteModel.create({ GuildID: guild?.id, bulletCount: 1 });
		}

		// Funny messages array
		const funnyMessages = [
			'Boom! Headshot!',
			'Better luck next time!',
			'You played yourself!',
			'Rest in peace!',
			'Game over, man!',
			'That\'s gotta hurt!',
			'You met your match!',
			'Try again if you dare!',
			'Maybe next time don\'t play with guns!',
			'You pulled the wrong trigger!'
		];

		// Get the current number of bullets in the chamber
		let bulletCount = rouletteDoc.bulletCount;

		// Simulate the revolver
		const result = randomInt(0, 6) < bulletCount ? 'got shot' : 'survived';

		// Select a random funny message if the user got shot
		const randomFunnyMessage = funnyMessages[randomInt(0, funnyMessages.length)];
		const response = result === 'survived'
			? `${userMention(user.id)} has survived the roulette! 🎉 and received 2000 gold\nBullets in Chamber: ${bulletCount}`
			: `${userMention(user.id)} got shot! 💥 ${randomFunnyMessage}\nBullets in Chamber: ${bulletCount}`;

		const embed = new EmbedBuilder()
			.setTitle('Roulette')
			.setDescription(response)
			.setColor(result === 'survived' ? 'Green' : 'Red');

		await interaction.reply({ embeds: [embed] });

		// If the user "got shot", apply a timeout (mute) in the server and reset the bullet count
		if (result === 'got shot') {
			const guildMember = await guild?.members.fetch(user.id);
			if (guildMember) {
				await guildMember.timeout(60000, 'lost in Russian roulette');
				await interaction.followUp({ content: `${userMention(interaction.user.id)} has been timed out for 60 Seconds after trying to beat the odds at Russian Roulette.` });
			}
			// Reset the bullet count to 1
			rouletteDoc.bulletCount = 1;
		} else {
			// Increase the user's balance by 2000
			userDoc.balance += 2000;
			await userDoc.save().catch(err => console.error('Error saving user document balance:', err));

			// Increment the bullet count
			bulletCount++;
			if (bulletCount > 6) bulletCount = 6; // Cap at 6 bullets
			rouletteDoc.bulletCount = bulletCount;
		}

		await rouletteDoc.save().catch(err => console.error('Error saving roulette document:', err));
	},
});