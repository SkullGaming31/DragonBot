import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	EmbedBuilder,
	MessageFlags
} from 'discord.js';
import { Command } from '../../Structures/Command';
import { error as logError } from '../../Utilities/logger';
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
				const price = interaction.options.getNumber('price', true);
				const quantity = interaction.options.getNumber('quantity') ?? 1;

				if (!item) return interaction.reply({ content: 'Please provide an item name.', flags: MessageFlags.Ephemeral });
				if (!Number.isSafeInteger(price) || price <= 0 || !Number.isSafeInteger(quantity) || quantity <= 0 || !Number.isSafeInteger(price * quantity)) {
					return interaction.reply({ content: 'Price and quantity must be positive whole numbers with a safe total.', flags: MessageFlags.Ephemeral });
				}

				const session = await UserModel.db.startSession();
				let doc: IListing | undefined;
				try {
					await session.withTransaction(async () => {
						const seller = await UserModel.findOne({ guildID: guildId, id: interaction.user.id }).session(session);
						if (!seller || seller.inventory.filter(value => value === item).length < quantity) throw new Error('MARKET_INSUFFICIENT_ITEMS');
						let remaining = quantity;
						seller.inventory = seller.inventory.filter(value => {
							if (value === item && remaining > 0) { remaining--; return false; }
							return true;
						});
						await seller.save({ session });
						[doc] = await ListingModel.create([{ guildID: guildId, sellerID: interaction.user.id, itemName: item, price, quantity, active: true, escrowed: true }], { session });
					});
				} catch (error) {
					if (error instanceof Error && error.message === 'MARKET_INSUFFICIENT_ITEMS') {
						return interaction.reply({ content: 'You do not own enough of that item.', flags: MessageFlags.Ephemeral });
					}
					throw error;
				} finally {
					await session.endSession();
				}
				if (!doc) throw new Error('Marketplace listing transaction did not return a listing');
				return interaction.reply({ content: `Listing created: ID ${doc._id} — ${quantity}x ${item} @ ${price}g each.` });
			}

			if (sub === 'list') {
				const seller = interaction.options.getString('seller');
				// Use a typed query shape matching the Listing model
				const query: FilterQuery<IListing> = { guildID: guildId, active: true, escrowed: true };
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
				const listing = await ListingModel.findOne({ _id: listingId, guildID: guildId }).exec();
				if (!listing) return interaction.reply({ content: 'Listing not found.', flags: MessageFlags.Ephemeral });
				if (listing.sellerID !== interaction.user.id) return interaction.reply({ content: 'Only the seller can remove this listing.', flags: MessageFlags.Ephemeral });

				const session = await UserModel.db.startSession();
				try {
					await session.withTransaction(async () => {
						const removed = await ListingModel.findOneAndDelete({ _id: listingId, guildID: guildId, sellerID: interaction.user.id }, { session });
						if (!removed) throw new Error('MARKET_LISTING_CHANGED');
						if (removed.escrowed && removed.quantity > 0) {
							const seller = await UserModel.findOneAndUpdate(
								{ guildID: guildId, id: interaction.user.id },
								{ $push: { inventory: { $each: Array<string>(removed.quantity).fill(removed.itemName) } } },
								{ session, new: true }
							);
							if (!seller) throw new Error('Seller account missing while returning escrow');
						}
					});
				} finally {
					await session.endSession();
				}
				return interaction.reply({ content: `Listing ${listingId} removed.` });
			}

			if (sub === 'buy') {
				const listingId = interaction.options.getString('id', true).trim();
				const quantity = interaction.options.getNumber('quantity') ?? 1;
				if (!Number.isSafeInteger(quantity) || quantity <= 0) return interaction.reply({ content: 'Quantity must be a positive whole number.', flags: MessageFlags.Ephemeral });

				const listing = await ListingModel.findOne({ _id: listingId, guildID: guildId }).exec();
				if (!listing || !listing.active || !listing.escrowed) return interaction.reply({ content: 'Listing not found, inactive, or not escrowed. Legacy listings cannot be purchased.', flags: MessageFlags.Ephemeral });
				if (listing.quantity < quantity) return interaction.reply({ content: 'Not enough quantity available.', flags: MessageFlags.Ephemeral });

				const total = listing.price * quantity;
				if (!Number.isSafeInteger(total) || total <= 0) throw new Error('Invalid marketplace listing price');
				const session = await UserModel.db.startSession();
				try {
					await session.withTransaction(async () => {
						const updatedListing = await ListingModel.findOneAndUpdate(
							{ _id: listingId, guildID: guildId, escrowed: true, active: true, quantity: { $gte: quantity }, sellerID: listing.sellerID, price: listing.price, itemName: listing.itemName },
							{ $inc: { quantity: -quantity } }, { new: true, session }
						);
						if (!updatedListing) throw new Error('MARKET_LISTING_CHANGED');
						const buyer = await UserModel.findOneAndUpdate(
							{ guildID: guildId, id: interaction.user.id, balance: { $gte: total } },
							{ $inc: { balance: -total }, $push: { inventory: { $each: Array<string>(quantity).fill(listing.itemName) } } },
							{ new: true, session }
						);
						if (!buyer) throw new Error('MARKET_INSUFFICIENT_FUNDS');
						const seller = await UserModel.findOneAndUpdate({ guildID: guildId, id: listing.sellerID }, { $inc: { balance: total } }, { new: true, session });
						if (!seller) throw new Error('Seller account missing during purchase');
						if (updatedListing.quantity === 0) await ListingModel.updateOne({ _id: listingId, guildID: guildId }, { active: false }, { session });
					});
				} catch (error) {
					if (error instanceof Error && error.message === 'MARKET_INSUFFICIENT_FUNDS') return interaction.reply({ content: 'Insufficient funds.', flags: MessageFlags.Ephemeral });
					if (error instanceof Error && error.message === 'MARKET_LISTING_CHANGED') return interaction.reply({ content: 'Listing no longer has enough items.', flags: MessageFlags.Ephemeral });
					throw error;
				} finally {
					await session.endSession();
				}

				return interaction.reply({ content: `You bought ${quantity}x ${listing.itemName} for ${total}g.` });
			}

			return interaction.reply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });

		} catch (err) {
			logError('Market command error:', { error: (err as Error)?.message ?? err });
			return interaction.reply({ content: 'An error occurred while processing the marketplace command.', flags: MessageFlags.Ephemeral });
		}
	}
});
