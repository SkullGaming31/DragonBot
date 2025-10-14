import { ApplicationCommandOptionType, ApplicationCommandType, MessageFlags } from 'discord.js';
import { ListingModel } from '../../Database/Schemas/marketListing';
import { UserModel } from '../../Database/Schemas/userModel';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'market-buy',
	description: 'Buy an item from the marketplace by listing id',
	Category: 'Fun',
	type: ApplicationCommandType.ChatInput,
	options: [
		{ name: 'id', description: 'Listing id', type: ApplicationCommandOptionType.String, required: true },
		{ name: 'quantity', description: 'Quantity to buy', type: ApplicationCommandOptionType.String, required: false }
	],
	run: async ({ interaction }) => {
		const guildId = interaction.guild?.id;
		const listingId = interaction.options.getString('id', true);
		const qtyRaw = interaction.options.getString('quantity', false) ?? '1';
		const quantity = Math.max(1, Math.floor(Number(qtyRaw) || 1));

		const listing = await ListingModel.findOne({ _id: listingId, guildID: guildId, active: true }).exec();
		if (!listing) return interaction.reply({ content: 'Listing not found or not active.', flags: MessageFlags.Ephemeral });
		if (listing.quantity < quantity) return interaction.reply({ content: 'Not enough quantity available.', flags: MessageFlags.Ephemeral });

		const total = listing.price * quantity;

		const session = await ListingModel.db.startSession?.();
		if (session && session.startTransaction) {
			try {
				session.startTransaction();
				// decrement buyer
				const buyer = await UserModel.findOneAndUpdate(
					{ guildID: guildId, id: interaction.user.id, balance: { $gte: total } },
					{ $inc: { balance: -total } },
					{ new: true, session }
				).exec();
				if (!buyer) {
					await session.abortTransaction();
					session.endSession();
					return interaction.reply({ content: 'Insufficient funds to buy.', flags: MessageFlags.Ephemeral });
				}

				// credit seller
				await UserModel.findOneAndUpdate({ guildID: guildId, id: listing.sellerID }, { $inc: { balance: total } }, { new: true, upsert: true, session }).exec();

				// decrement listing quantity and disable if zero
				const updated = await ListingModel.findOneAndUpdate({ _id: listingId, quantity: { $gte: quantity } }, { $inc: { quantity: -quantity } }, { new: true, session }).exec();
				if (!updated) {
					await session.abortTransaction();
					session.endSession();
					return interaction.reply({ content: 'Failed to reserve listing quantity.', flags: MessageFlags.Ephemeral });
				}

				if ((updated.quantity ?? 0) <= 0) {
					await ListingModel.updateOne({ _id: listingId }, { active: false }, { session }).exec();
				}

				await session.commitTransaction();
				session.endSession();
				return interaction.reply({ content: `Purchased ${quantity} x ${listing.itemName} for ${total}g.` });
			} catch (err) {
				// Log the error for debugging
				 
				console.error('marketBuy transaction error', err);
				await session.abortTransaction();
				session.endSession();
				return interaction.reply({ content: 'Purchase failed, please try again later.', flags: MessageFlags.Ephemeral });
			}
		}

		// Fallback non-transactional flow
		const buyerRes = await UserModel.findOneAndUpdate({ guildID: guildId, id: interaction.user.id, balance: { $gte: total } }, { $inc: { balance: -total } }, { new: true }).exec();
		if (!buyerRes) return interaction.reply({ content: 'Insufficient funds to buy.', flags: MessageFlags.Ephemeral });

		await UserModel.findOneAndUpdate({ guildID: guildId, id: listing.sellerID }, { $inc: { balance: total } }, { new: true, upsert: true }).exec();

		const updated = await ListingModel.findOneAndUpdate({ _id: listingId, quantity: { $gte: quantity } }, { $inc: { quantity: -quantity } }, { new: true }).exec();
		if (!updated) {
			// rollback buyer credit if possible
			await UserModel.findOneAndUpdate({ guildID: guildId, id: interaction.user.id }, { $inc: { balance: total } }).exec();
			return interaction.reply({ content: 'Failed to reserve listing quantity; refund issued.', flags: MessageFlags.Ephemeral });
		}

		if ((updated.quantity ?? 0) <= 0) {
			await ListingModel.updateOne({ _id: listingId }, { active: false }).exec();
		}

		return interaction.reply({ content: `Purchased ${quantity} x ${listing.itemName} for ${total}g.` });
	}
});
