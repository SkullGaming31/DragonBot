import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';
import { Command } from '../../Structures/Command';
// import { UserModel, IUser } from 'Structures/Schemas/userModel';
import { randomInt } from 'node:crypto';

export default new Command({
	name: 'dig',
	description: 'Dig up caches and earn points but watch out for the bombs',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
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
		const { options, user } = interaction;

		// Parse the dig amount from the arguments
		const digAmount = options.getNumber('amount');

		// Check if the dig amount is valid
		if (!digAmount || digAmount <= 0) return interaction.reply({ content: 'Invalid bet amount, Usage:', ephemeral: true });

		const isGuildOwner = interaction.member.id === interaction.guild?.ownerId;
		if (!isGuildOwner) {
			// Check if the user has enough balance
			// const userDoc = await UserModel.findOne<IUser>({ id: user.id });
			// if (userDoc?.balance === undefined) return;
			// if (!userDoc || userDoc.balance < digAmount) { return interaction.reply({ content: 'You don\'t have enough balance to dig.', ephemeral: true }); }
		}
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
			// await UserModel.updateOne({ id: user.id }, { $inc: { balance: -digAmount } });
			return interaction.reply({ content: `${user}, You dug up a bomb and lost ${digAmount} gold. Better luck next time!` });
		}
		// If the user didn't dig up a bomb, award them with a prize
		const prizeAmount = Math.floor(Math.random() * (digAmount * 2)) + digAmount;
		// await UserModel.updateOne({ id: user.id }, { $inc: { balance: prizeAmount } });
		return interaction.reply({ content: `${user}, You dug up the cache and won ${prizeAmount} gold!` });
	}
});