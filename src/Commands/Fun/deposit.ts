import { ApplicationCommandOptionType, ApplicationCommandType, MessageFlags } from 'discord.js';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

export default new Command({
  name: 'deposit',
  description: 'Deposit gold from your wallet into your bank',
  UserPerms: ['SendMessages'],
  BotPerms: ['SendMessages'],
  defaultMemberPermissions: ['SendMessages'],
  Category: 'Fun',
  type: ApplicationCommandType.ChatInput,
  options: [
    { name: 'amount', description: 'Amount to deposit (or "all")', type: ApplicationCommandOptionType.String, required: true }
  ],
  run: async ({ interaction }) => {
    const { guild, user, options } = interaction;
    const amountRaw = options.getString('amount', true);
    const settingsDoc = await SettingsModel.findOne({ GuildID: guild?.id });

    const econChannel = settingsDoc?.EconChan ? interaction.guild?.channels.cache.get(settingsDoc.EconChan) : interaction.channel;
    if (econChannel && econChannel.id !== interaction.channel?.id) {
      return interaction.reply({ content: `Please use the economy channel for this command.`, flags: MessageFlags.Ephemeral });
    }

    // Resolve amount
    let amount: number;
    if (amountRaw.toLowerCase() === 'all') {
      const userDoc = await UserModel.findOne({ guildID: guild?.id, id: user.id }).select('balance');
      amount = userDoc?.balance ?? 0;
    } else {
      amount = Math.floor(Number(amountRaw));
    }

    if (!amount || amount <= 0) return interaction.reply({ content: 'Please provide a valid amount greater than 0.', flags: MessageFlags.Ephemeral });

    // Atomic guarded update: decrement balance if sufficient, increment bank
    const res = await UserModel.findOneAndUpdate(
      { guildID: guild?.id, id: user.id, balance: { $gte: amount } },
      { $inc: { balance: -amount, bank: amount } },
      { new: true, upsert: true }
    ).exec();

    if (!res) return interaction.reply({ content: 'Insufficient funds to deposit that amount.', flags: MessageFlags.Ephemeral });

    return interaction.reply({ content: `Deposited ${amount} gold into your bank. New balances — Wallet: ${res.balance}, Bank: ${res.bank}` });
  }
});
