import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';
import { UserModel, IUser } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'transfer',
	description: 'Transfer gold to another user',
	Category: 'Fun',
	type: ApplicationCommandType.ChatInput,
	options: [
		{ name: 'user', description: 'Recipient user id', type: ApplicationCommandOptionType.String, required: true },
		{ name: 'amount', description: 'Amount to transfer or "all"', type: ApplicationCommandOptionType.String, required: true }
	],
	run: async ({ interaction }) => {
		const { guild, options, user } = interaction;
		const targetId = options.getString('user', true);
		const amountRaw = options.getString('amount', true);

		if (targetId === user.id) return interaction.reply({ content: 'You cannot transfer to yourself.', ephemeral: true });

		// resolve amount
		let amount = 0;
		if (amountRaw.toLowerCase() === 'all') {
			const q = UserModel.findOne({ guildID: guild?.id, id: user.id }).select('balance');
			const senderDoc = q.lean ? await q.lean().exec() : await q.exec();
			amount = (senderDoc as IUser | null)?.balance ?? 0;
		} else {
			amount = Math.floor(Number(amountRaw));
		}

		if (!amount || amount <= 0) return interaction.reply({ content: 'Please provide a valid amount greater than 0.', ephemeral: true });

		// Atomic transfer: decrement sender if sufficient, increment recipient
		const session = await UserModel.db.startSession?.();
		if (session && session.startTransaction) {
			// try transaction if supported (e.g., in production with replica set)
			try {
				session.startTransaction();
				const sender = await UserModel.findOneAndUpdate(
					{ guildID: guild?.id, id: user.id, balance: { $gte: amount } },
					{ $inc: { balance: -amount } },
					{ new: true, session }
				).exec();

				if (!sender) {
					await session.abortTransaction();
					session.endSession();
					return interaction.reply({ content: 'Insufficient funds.', ephemeral: true });
				}

				await UserModel.findOneAndUpdate(
					{ guildID: guild?.id, id: targetId },
					{ $inc: { balance: amount } },
					{ new: true, upsert: true, session }
				).exec();

				await session.commitTransaction();
				session.endSession();
				return interaction.reply({ content: `Transferred ${amount} gold to <@${targetId}>.` });
			} catch {
				await session.abortTransaction();
				session.endSession();
				return interaction.reply({ content: 'Transfer failed, please try again later.', ephemeral: true });
			}
		}

		// Fallback: guarded single-document update then increment recipient
		const senderRes = await UserModel.findOneAndUpdate(
			{ guildID: guild?.id, id: user.id, balance: { $gte: amount } },
			{ $inc: { balance: -amount } },
			{ new: true }
		).exec();

		if (!senderRes) return interaction.reply({ content: 'Insufficient funds.', ephemeral: true });

		await UserModel.findOneAndUpdate({ guildID: guild?.id, id: targetId }, { $inc: { balance: amount } }, { new: true, upsert: true }).exec();

		return interaction.reply({ content: `Transferred ${amount} gold to <@${targetId}>.` });
	}
});
