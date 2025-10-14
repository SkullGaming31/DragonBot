import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';
import { Command } from '../../Structures/Command';
import { ListingModel } from '../../Database/Schemas/marketListing';
import { UserModel } from '../../Database/Schemas/userModel';

export default new Command({
	name: 'market-buy',
	description: 'Buy from marketplace',
	Category: 'Fun',
	type: ApplicationCommandType.ChatInput,
	options: [
		{ name: 'listing', description: 'Listing id', type: ApplicationCommandOptionType.String, required: true },
		{ name: 'qty', description: 'Quantity to buy', type: ApplicationCommandOptionType.Number, required: false }
	],
	run: async ({ interaction }) => {
		const { guild, options, user } = interaction;
		const listingId = options.getString('listing', true).trim();
		const qty = Math.max(1, Math.floor(options.getNumber('qty') ?? 1));

		if (!guild) return interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });

		// load listing
		const listing = await ListingModel.findById(listingId).exec();
		if (!listing || !listing.active) return interaction.reply({ content: 'Listing not found or inactive.', ephemeral: true });
		if (listing.quantity < qty) return interaction.reply({ content: 'Not enough quantity available.', ephemeral: true });

		const total = listing.price * qty;

		// Try transaction (if replica-set), else fallback to guarded update
		const session = await UserModel.db.startSession?.();
		if (session && session.startTransaction) {
			try {
				session.startTransaction();
				// decrement buyer balance if sufficient
				const buyer = await UserModel.findOneAndUpdate(
					{ guildID: guild.id, id: user.id, balance: { $gte: total } },
					{ $inc: { balance: -total } },
					{ new: true, session }
				).exec();

				if (!buyer) {
					await session.abortTransaction();
					session.endSession();
					return interaction.reply({ content: 'Insufficient funds.', ephemeral: true });
				}

				// decrement listing quantity (fail if not enough)
				const updated = await ListingModel.findOneAndUpdate(
					{ _id: listingId, quantity: { $gte: qty }, active: true },
					{ $inc: { quantity: -qty } },
					{ new: true, session }
				).exec();

				if (!updated) {
					await session.abortTransaction();
					session.endSession();
					return interaction.reply({ content: 'Failed to reserve items (race condition). Please try again.', ephemeral: true });
				}

				// credit seller (upsert user doc)
				await UserModel.findOneAndUpdate(
					{ guildID: guild.id, id: listing.sellerID },
					{ $inc: { balance: total } },
					{ new: true, upsert: true, session }
				).exec();

				await session.commitTransaction();
				session.endSession();
				return interaction.reply({ content: `You bought ${qty}x ${listing.itemName} for ${total}g.`, ephemeral: false });
			} catch (err) {
				await session.abortTransaction();
				session.endSession();
				console.error('Market buy transaction failed:', err);
				return interaction.reply({ content: 'Purchase failed, please try again later.', ephemeral: true });
			}
		}

		// Fallback: guarded updates without transactions
		const buyerRes = await UserModel.findOneAndUpdate(
			{ guildID: guild.id, id: user.id, balance: { $gte: total } },
			{ $inc: { balance: -total } },
			{ new: true }
		).exec();
		if (!buyerRes) return interaction.reply({ content: 'Insufficient funds.', ephemeral: true });

		// Try to decrement listing atomically
		const listingRes = await ListingModel.findOneAndUpdate(
			{ _id: listingId, quantity: { $gte: qty }, active: true },
			{ $inc: { quantity: -qty } },
			{ new: true }
		).exec();
		if (!listingRes) {
			// rollback buyer increment
			await UserModel.findOneAndUpdate({ guildID: guild.id, id: user.id }, { $inc: { balance: total } }).exec();
			return interaction.reply({ content: 'Failed to reserve items (race). Transaction rolled back.', ephemeral: true });
		}

		// credit seller
		await UserModel.findOneAndUpdate({ guildID: guild.id, id: listing.sellerID }, { $inc: { balance: total } }, { new: true, upsert: true }).exec();

		return interaction.reply({ content: `You bought ${qty}x ${listing.itemName} for ${total}g.`, ephemeral: false });
	}
});
