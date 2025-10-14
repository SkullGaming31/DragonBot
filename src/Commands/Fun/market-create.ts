import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';
import { Command } from '../../Structures/Command';
import { ListingModel } from '../../Database/Schemas/marketListing';

export default new Command({
	name: 'market-create',
	description: 'Create a marketplace listing',
	Category: 'Fun',
	type: ApplicationCommandType.ChatInput,
	options: [
		{ name: 'item', description: 'Item name', type: ApplicationCommandOptionType.String, required: true },
		{ name: 'price', description: 'Price per item', type: ApplicationCommandOptionType.Number, required: true },
		{ name: 'quantity', description: 'Quantity available', type: ApplicationCommandOptionType.Number, required: false }
	],
	run: async ({ interaction }) => {
		const { guild, options, user } = interaction;
		const item = options.getString('item', true).trim();
		const price = Math.max(0, Math.floor(options.getNumber('price', true)));
		const quantity = Math.max(1, Math.floor(options.getNumber('quantity') ?? 1));

		if (!guild) return interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });
		if (!item) return interaction.reply({ content: 'Please provide an item name.', ephemeral: true });
		if (price <= 0) return interaction.reply({ content: 'Price must be greater than 0.', ephemeral: true });

		try {
			const doc = new ListingModel({
				guildID: guild.id,
				sellerID: user.id,
				itemName: item,
				price,
				quantity,
				active: true
			});
			await doc.save();
			return interaction.reply({ content: `Listing created: ID ${doc._id} — ${quantity}x ${item} @ ${price}g each.`, ephemeral: false });
		} catch (err) {
			console.error('Failed to create listing:', err);
			return interaction.reply({ content: 'Failed to create listing.', ephemeral: true });
		}
	}
});
