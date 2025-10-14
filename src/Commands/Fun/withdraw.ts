import { ApplicationCommandOptionType, ApplicationCommandType, MessageFlags } from 'discord.js';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { UserModel, IUser } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'withdraw',
	description: 'Withdraw gold from your bank into your wallet',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	Category: 'Fun',
	type: ApplicationCommandType.ChatInput,
	options: [
		{ name: 'amount', description: 'Amount to withdraw (or "all")', type: ApplicationCommandOptionType.String, required: true }
	],
	run: async ({ interaction }) => {
		const { guild, user, options } = interaction;
		const amountRaw = options.getString('amount', true);
		const settingsDoc = await SettingsModel.findOne({ GuildID: guild?.id });

		const econChannel = settingsDoc?.EconChan ? interaction.guild?.channels.cache.get(settingsDoc.EconChan) : interaction.channel;
		if (econChannel && econChannel.id !== interaction.channel?.id) {
			return interaction.reply({ content: 'Please use the economy channel for this command.', flags: MessageFlags.Ephemeral });
		}

		// Resolve amount
		let amount: number;
		if (amountRaw.toLowerCase() === 'all') {
			const q = UserModel.findOne({ guildID: guild?.id, id: user.id }).select('bank');
			const userDoc = q.lean ? await q.lean().exec() : await q.exec();
			amount = (userDoc as IUser | null)?.bank ?? 0;
		} else {
			amount = Math.floor(Number(amountRaw));
		}

		if (!amount || amount <= 0) return interaction.reply({ content: 'Please provide a valid amount greater than 0.', flags: MessageFlags.Ephemeral });

		// Atomic guarded update: decrement bank if sufficient, increment balance
		const res = await UserModel.findOneAndUpdate(
			{ guildID: guild?.id, id: user.id, bank: { $gte: amount } },
			{ $inc: { bank: -amount, balance: amount } },
			{ new: true, upsert: true }
		).exec();

		if (!res) return interaction.reply({ content: 'Insufficient funds in bank to withdraw that amount.', flags: MessageFlags.Ephemeral });

		return interaction.reply({ content: `Withdrew ${amount} gold from your bank. New balances — Wallet: ${res.balance}, Bank: ${res.bank}` });
	}
});
