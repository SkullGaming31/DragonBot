import {
	ApplicationCommandOptionType,
	ApplicationCommandType,
	EmbedBuilder,
	MessageFlags
} from 'discord.js';
import { Command } from '../../Structures/Command';
import { ListingModel, IListing } from '../../Database/Schemas/marketListing';
import { OfferModel } from '../../Database/Schemas/marketOffer';
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
				{ name: 'price', description: 'Price per item (number or shorthand like 1k, 2.5m)', type: ApplicationCommandOptionType.String, required: true },
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
		},
		// {
		// 	name: 'offer',
		// 	description: 'Make an offer on a listing',
		// 	type: ApplicationCommandOptionType.Subcommand,
		// 	options: [
		// 		{ name: 'id', description: 'Listing id', type: ApplicationCommandOptionType.String, required: true },
		// 		{ name: 'price', description: 'Offer price (number or item name)', type: ApplicationCommandOptionType.String, required: true },
		// 		{ name: 'quantity', description: 'Quantity to offer for', type: ApplicationCommandOptionType.Number, required: false }
		// 	]
		// },
	],
	run: async ({ interaction }) => {
		function parseAmount(input: string | null | undefined): number | null {
			if (!input) return null;
			const cleaned = String(input).replace(/[,\s]/g, '').toLowerCase();
			if (cleaned.length === 0) return null;
			// handle suffixes k, m
			const suffix = cleaned[cleaned.length - 1];
			let numStr = cleaned;
			let multiplier = 1;
			if (suffix === 'k' || suffix === 'm') {
				numStr = cleaned.slice(0, -1);
				multiplier = suffix === 'k' ? 1e3 : 1e6;
			}
			const value = Number(numStr);
			if (Number.isNaN(value)) return null;
			return Math.max(0, Math.floor(value * multiplier));
		}

		const sub = interaction.options.getSubcommand();
		const guildId = interaction.guild?.id;

		if (!guildId) return interaction.reply({ content: 'This command must be used in a server.', flags: MessageFlags.Ephemeral });

		try {
			if (sub === 'create') {
				const item = interaction.options.getString('item', true).trim();
				const priceRaw = interaction.options.getString('price', true);
				const qtyNum = interaction.options.getNumber('quantity');

				// price can be shorthand numeric (1k, 2.5m) OR an item name for barter listings
				const priceParsed = parseAmount(priceRaw);
				const quantity = Math.max(1, Math.floor(qtyNum ?? 1));

				if (!item) return interaction.reply({ content: 'Please provide an item name.', flags: MessageFlags.Ephemeral });

				let price: number | string;
				if (priceParsed !== null) {
					price = priceParsed;
					if (price <= 0) return interaction.reply({ content: 'Price must be a positive number (examples: 100, 1k, 2.5m).', flags: MessageFlags.Ephemeral });
				} else {
					// treat the provided price as an item name for barter
					price = priceRaw.trim();
					if (price.length === 0) return interaction.reply({ content: 'Please provide a valid price or item name.', flags: MessageFlags.Ephemeral });
				}

				const doc = new ListingModel({ guildID: guildId, sellerID: interaction.user.id, itemName: item, price, quantity, active: true });
				await doc.save();
				if (typeof price === 'number') {
					return interaction.reply({ content: `Listing created: ID ${doc._id} — ${quantity}x ${item} @ ${price}g each.` });
				} else {
					return interaction.reply({ content: `Barter listing created: ID ${doc._id} — ${quantity}x ${item} for ${price} each.` });
				}
			}

			if (sub === 'list') {
				const seller = interaction.options.getString('seller');
				// Use a typed query shape matching the Listing model
				const query: FilterQuery<IListing> = { guildID: guildId, active: true };
				if (seller) {
					// Accept a mention like <@123456789> or a raw id; extract numeric id from mention
					const mentionMatch = seller.match(/^<@!?(\d+)>$/);
					const sellerId = mentionMatch ? mentionMatch[1] : seller;
					// If the provided value looks like a Mongo ObjectId (24 hex chars), allow searching
					// for either sellerID or the listing _id so users can pass the listing ID directly.
					if (/^[0-9a-fA-F]{24}$/.test(sellerId)) {
						query.$or = [{ sellerID: sellerId }, { _id: sellerId }];
					} else {
						query.sellerID = sellerId;
					}
				}

				const listings = await ListingModel.find(query).sort({ createdAt: -1 }).limit(50).lean().exec();
				if (!listings || listings.length === 0) return interaction.reply({ content: 'No listings found.', flags: MessageFlags.Ephemeral });

				const embed = new EmbedBuilder().setTitle('Marketplace Listings').setDescription(`Found ${listings.length} listing(s)`).setColor('Blue');
				for (const l of listings) {
					const priceDisplay = typeof l.price === 'number' ? `${l.price}g` : String(l.price);
					embed.addFields({ name: `${l.itemName} — ${l.quantity}x @ ${priceDisplay}`, value: `ID: ${l._id} • Seller: <@${l.sellerID}>`, inline: false });
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

				// If this is a barter listing (price is a string), buying with currency is not supported
				if (typeof listing.price !== 'number') {
					return interaction.reply({ content: `This listing is a barter: the seller wants "${listing.price}" in exchange. Currency purchases are not supported for barter listings.`, flags: MessageFlags.Ephemeral });
				}

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

			if (sub === 'offer') {
				const listingId = interaction.options.getString('id', true).trim();
				const priceRaw = interaction.options.getString('price', true);
				const qtyNum = interaction.options.getNumber('quantity');
				const quantity = Math.max(1, Math.floor(qtyNum ?? 1));

				const listing = await ListingModel.findById(listingId).exec();
				if (!listing || !listing.active) return interaction.reply({ content: 'Listing not found or inactive.', flags: MessageFlags.Ephemeral });
				if (listing.quantity < quantity) return interaction.reply({ content: 'Not enough quantity available on the listing.', flags: MessageFlags.Ephemeral });

				// parse offered price (number shorthand or item name)
				const priceParsed = parseAmount(priceRaw);
				let offerPrice: number | string;
				if (priceParsed !== null) {
					offerPrice = priceParsed;
					if (offerPrice <= 0) return interaction.reply({ content: 'Offer price must be a positive number (examples: 100, 1k, 2.5m).', flags: MessageFlags.Ephemeral });
				} else {
					offerPrice = priceRaw.trim();
					if (offerPrice.length === 0) return interaction.reply({ content: 'Please provide a valid offer price or item name.', flags: MessageFlags.Ephemeral });
				}

				const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
				const offerDoc = new OfferModel({ listingID: listingId, buyerID: interaction.user.id, price: offerPrice, quantity, status: 'pending', createdAt: new Date(), expiresAt });
				await offerDoc.save();

				// Notify seller via DM where possible
				try {
					const sellerUser = await interaction.client.users.fetch(listing.sellerID);
					await sellerUser.send(`You have received an offer on your listing ${listing._id}: ${interaction.user.tag} offers ${typeof offerPrice === 'number' ? `${offerPrice}g` : offerPrice} for ${quantity}x ${listing.itemName}. Offer ID: ${offerDoc._id}. Expires: ${expiresAt.toISOString()}`);
				} catch (err) {
					// ignore DM failures
				}

				return interaction.reply({ content: `Offer created: ID ${offerDoc._id} — ${quantity}x ${listing.itemName} offering ${typeof offerPrice === 'number' ? `${offerPrice}g` : offerPrice}. Expires in 12 hours.`, flags: MessageFlags.Ephemeral });
			}

			return interaction.reply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });

		} catch (err) {
			console.error('Market command error:', err);
			return interaction.reply({ content: 'An error occurred while processing the marketplace command.', flags: MessageFlags.Ephemeral });
		}
	}
});
