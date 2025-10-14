import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';
import { Command } from '../../Structures/Command';
import { ListingModel } from '../../Database/Schemas/marketListing';

export default new Command({
	name: 'market-remove',
	description: 'Remove your marketplace listing',
	Category: 'Fun',
	type: ApplicationCommandType.ChatInput,
	options: [
		{ name: 'listing', description: 'Listing id', type: ApplicationCommandOptionType.String, required: true }
	],
	run: async ({ interaction }) => {
		const { guild, options, user } = interaction;
		const listingId = options.getString('listing', true).trim();

		if (!guild) return interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });

		const listing = await ListingModel.findById(listingId).exec();
		if (!listing) return interaction.reply({ content: 'Listing not found.', ephemeral: true });
		if (listing.sellerID !== user.id) return interaction.reply({ content: 'Only the seller can remove this listing.', ephemeral: true });

		try {
			await ListingModel.deleteOne({ _id: listingId }).exec();
			return interaction.reply({ content: `Listing ${listingId} removed.`, ephemeral: false });
		} catch (err) {
			console.error('Failed to remove listing:', err);
			return interaction.reply({ content: 'Failed to remove listing. Please try again later.', ephemeral: true });
		}
	}
});
