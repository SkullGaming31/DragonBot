import { ApplicationCommandOptionType, ApplicationCommandType, channelMention, userMention } from 'discord.js';
import { randomInt } from 'node:crypto';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { IUser, UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'dig',
	description: 'Dig up caches and earn points but watch out for the bombs',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	Cooldown: 60000,
	options: [
		{
			name: 'amount',
			description: 'Choose the amount to bet',
			type: ApplicationCommandOptionType.Number,
			required: true
		}
	],
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		const { options, user, channel, guild } = interaction;

		// Parse the dig amount from the arguments
		const digAmount = options.getNumber('amount');


		// Check if the dig amount is valid
		if (!digAmount || digAmount <= 0) return interaction.reply({ content: 'Invalid bet amount, Usage:', ephemeral: true });

		if (digAmount < 100 || digAmount > 5000) return interaction.reply({ content: 'Invalid bet amount. Minimum bet is 100 gold and maximum is 5000 gold.', ephemeral: true, });
		// Check settings for economy channel
		const settings = await SettingsModel.findOne({ GuildID: guild?.id });

		let economyChannel;
		if (settings && settings.EconChan) {
			if (process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug') {
				console.log('econchannelid: ', economyChannel);
			}
			economyChannel = guild?.channels.cache.get(settings.EconChan);
		} else {
			// No economy channel set, use the command channel
			economyChannel = interaction.channel;
		}
		if (economyChannel) {
			if (channel?.id !== economyChannel?.id) {
				return interaction.reply({ content: `${userMention(user.id)}, You can only use this command in the economy spam channel ${channelMention(economyChannel.id)}`, ephemeral: true });
			}
		}

		// Check if the user has enough balance
		const userDoc = await UserModel.findOne<IUser>({ id: user.id });
		if (userDoc?.balance === undefined) return;
		if (!userDoc || userDoc.balance < digAmount) { return interaction.reply({ content: 'You don\'t have enough balance to dig.', ephemeral: true }); }
		// Deduct the dig amount from the user's balance
		// await UserModel.updateOne({ id: user.id, balance: { $gte: digAmount } }, { $inc: { balance: -digAmount } });

		// Generate a random number between 1-3 to decide how many bombs are in play
		const numBombs = randomInt(1, 4);

		// Generate an array of holes with the specified number of bombs
		const holes: string[] = [];
		for (let i = 0; i < 5; i++) {
			if (i < numBombs) {
				holes.push('bomb');
				continue;
			}
			holes.push('empty');
		}

		// Shuffle the holes randomly
		for (let i = holes.length - 1; i > 0; i--) {
			const j = randomInt(0, i + 1);
			[holes[i], holes[j]] = [holes[j], holes[i]];
		}

		// Check if the user dug up a bomb
		if (holes[0] === 'bomb') {
			await UserModel.updateOne({ id: user.id }, { $inc: { balance: -digAmount } });
			const badLuckMessages = [
				'You dug up a bomb and lost ${digAmount} gold. There were ${numBombs} bombs in play. Better luck next time!',
				'Oops! You hit a bomb and lost ${digAmount} gold. Try again soon!',
				'Seems like you triggered a buried treasure! Unfortunately, it was a bomb. Don\'t give up, ${username}!',
				'Looks like today isn\'t your lucky day. You dug up a bomb and lost ${digAmount} gold. There were ${numBombs} bombs in play, Keep digging!',
				'you avoid digging up the cache to follow a modvlog to a shed which he drops a grenade on you, you lost ${digAmount}'
			];

			const randomIndex = Math.floor(Math.random() * badLuckMessages.length);
			const randomMessage = badLuckMessages[randomIndex].replace('${digAmount}', digAmount.toString()).replace('${username}', user.username).replace('${numBombs}', numBombs.toString());
			return interaction.reply({ content: randomMessage, });
		}
		// If the user didn't dig up a bomb, award them with a prize
		const prizeAmount = Math.floor(Math.random() * (digAmount * 2)) + digAmount;
		await UserModel.updateOne({ id: user.id }, { $inc: { balance: prizeAmount } });
		return interaction.reply({ content: `${userMention(user.id)}, You dug up the cache and won ${prizeAmount} gold! You successfully avoided ${numBombs} bombs!` });
	}
});