import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	EmbedBuilder,
	MessageFlags
} from 'discord.js';
import { Command } from '../../Structures/Command';
import { ListingModel, IListing } from '../../Database/Schemas/marketListing';
import { UserModel } from '../../Database/Schemas/userModel';
import { FilterQuery } from 'mongoose';

export default new Command({
	name: 'market',
	description: 'Marketplace commands (create, list, remove, buy)',
	Category: 'Fun',
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'create',
			description: 'Create a listing',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{ name: 'item', description: 'Item name', type: ApplicationCommandOptionType.String, required: true },
				{ name: 'price', description: 'Price per item', type: ApplicationCommandOptionType.Number, required: true },
				{ name: 'quantity', description: 'Quantity available', type: ApplicationCommandOptionType.Number, required: false }
			]
		},
		{
			name: 'list',
			description: 'List marketplace listings',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{ name: 'seller', description: 'Optional seller id to filter', type: ApplicationCommandOptionType.String, required: false }
			]
		},
		{
			name: 'remove',
			description: 'Remove your listing',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{ name: 'id', description: 'Listing id', type: ApplicationCommandOptionType.String, required: true }
			]
		},
		{
			name: 'buy',
			description: 'Buy from the marketplace',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{ name: 'id', description: 'Listing id', type: ApplicationCommandOptionType.String, required: true },
				{ name: 'quantity', description: 'Quantity to buy', type: ApplicationCommandOptionType.Number, required: false }
			]
		}
	],
	run: async ({ interaction }) => {
		const sub = interaction.options.getSubcommand();
		const guildId = interaction.guild?.id;

		if (!guildId) return interaction.reply({ content: 'This command must be used in a server.', flags: MessageFlags.Ephemeral });

		try {
			if (sub === 'create') {
				const item = interaction.options.getString('item', true).trim();
				const price = Math.max(0, Math.floor(interaction.options.getNumber('price', true)));
				const quantity = Math.max(1, Math.floor(interaction.options.getNumber('quantity') ?? 1));

				if (!item) return interaction.reply({ content: 'Please provide an item name.', flags: MessageFlags.Ephemeral });
				if (price <= 0) return interaction.reply({ content: 'Price must be greater than 0.', flags: MessageFlags.Ephemeral });

				const doc = new ListingModel({ guildID: guildId, sellerID: interaction.user.id, itemName: item, price, quantity, active: true });
				await doc.save();
				return interaction.reply({ content: `Listing created: ID ${doc._id} — ${quantity}x ${item} @ ${price}g each.` });
			}

			if (sub === 'list') {
				const seller = interaction.options.getString('seller');
				// Use a typed query shape matching the Listing model
				const query: FilterQuery<IListing> = { guildID: guildId, active: true };
				if (seller) query.sellerID = seller;

				const listings = await ListingModel.find(query).sort({ createdAt: -1 }).limit(50).lean().exec();
				if (!listings || listings.length === 0) return interaction.reply({ content: 'No listings found.', flags: MessageFlags.Ephemeral });

				const embed = new EmbedBuilder().setTitle('Marketplace Listings').setDescription(`Found ${listings.length} listing(s)`).setColor('Blue');
				for (const l of listings) {
					embed.addFields({ name: `${l.itemName} — ${l.quantity}x @ ${l.price}g`, value: `ID: ${l._id} • Seller: <@${l.sellerID}>`, inline: false });
				}

				return interaction.reply({ embeds: [embed] });
			}

			if (sub === 'remove') {
				const listingId = interaction.options.getString('id', true).trim();
				const listing = await ListingModel.findById(listingId).exec();
				if (!listing) return interaction.reply({ content: 'Listing not found.', flags: MessageFlags.Ephemeral });
				if (listing.sellerID !== interaction.user.id) return interaction.reply({ content: 'Only the seller can remove this listing.', flags: MessageFlags.Ephemeral });

				await ListingModel.deleteOne({ _id: listingId }).exec();
				return interaction.reply({ content: `Listing ${listingId} removed.` });
			}

			if (sub === 'buy') {
				const listingId = interaction.options.getString('id', true).trim();
				const quantity = Math.max(1, Math.floor(interaction.options.getNumber('quantity') ?? 1));

				const listing = await ListingModel.findById(listingId).exec();
				if (!listing || !listing.active) return interaction.reply({ content: 'Listing not found or inactive.', flags: MessageFlags.Ephemeral });
				if (listing.quantity < quantity) return interaction.reply({ content: 'Not enough quantity available.', flags: MessageFlags.Ephemeral });

				const total = listing.price * quantity;
				const session = await UserModel.db.startSession?.();

				if (session && session.startTransaction) {
					try {
						session.startTransaction();
						const buyer = await UserModel.findOneAndUpdate({ guildID: guildId, id: interaction.user.id, balance: { $gte: total } }, { $inc: { balance: -total } }, { new: true, session }).exec();
						if (!buyer) { await session.abortTransaction(); session.endSession(); return interaction.reply({ content: 'Insufficient funds.', flags: MessageFlags.Ephemeral }); }

						const updatedListing = await ListingModel.findOneAndUpdate({ _id: listingId, quantity: { $gte: quantity }, active: true }, { $inc: { quantity: -quantity } }, { new: true, session }).exec();
						if (!updatedListing) { await session.abortTransaction(); session.endSession(); return interaction.reply({ content: 'Failed to reserve items (race).', flags: MessageFlags.Ephemeral }); }

						await UserModel.findOneAndUpdate({ guildID: guildId, id: listing.sellerID }, { $inc: { balance: total } }, { new: true, upsert: true, session }).exec();

						if ((updatedListing.quantity ?? 0) <= 0) {
							await ListingModel.updateOne({ _id: listingId }, { active: false }, { session }).exec();
						}

						await session.commitTransaction();
						session.endSession();
						return interaction.reply({ content: `You bought ${quantity}x ${listing.itemName} for ${total}g.` });
					} catch (err) {
						await session.abortTransaction(); session.endSession(); console.error('Market buy transaction failed:', err);
						return interaction.reply({ content: 'Purchase failed, please try again later.', flags: MessageFlags.Ephemeral });
					}
				}

				// Fallback
				const buyerRes = await UserModel.findOneAndUpdate({ guildID: guildId, id: interaction.user.id, balance: { $gte: total } }, { $inc: { balance: -total } }, { new: true }).exec();
				if (!buyerRes) return interaction.reply({ content: 'Insufficient funds.', flags: MessageFlags.Ephemeral });

				const listingRes = await ListingModel.findOneAndUpdate({ _id: listingId, quantity: { $gte: quantity }, active: true }, { $inc: { quantity: -quantity } }, { new: true }).exec();
				if (!listingRes) { await UserModel.findOneAndUpdate({ guildID: guildId, id: interaction.user.id }, { $inc: { balance: total } }).exec(); return interaction.reply({ content: 'Failed to reserve items (race). Refund issued.', flags: MessageFlags.Ephemeral }); }

				await UserModel.findOneAndUpdate({ guildID: guildId, id: listing.sellerID }, { $inc: { balance: total } }, { new: true, upsert: true }).exec();
				if ((listingRes.quantity ?? 0) <= 0) { await ListingModel.updateOne({ _id: listingId }, { active: false }).exec(); }

				return interaction.reply({ content: `You bought ${quantity}x ${listing.itemName} for ${total}g.` });
			}

			return interaction.reply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });

		} catch (err) {
			console.error('Market command error:', err);
			return interaction.reply({ content: 'An error occurred while processing the marketplace command.', flags: MessageFlags.Ephemeral });
		}
	}
});
