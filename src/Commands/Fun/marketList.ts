import { ApplicationCommandType } from 'discord.js';
import { ListingModel } from '../../Database/Schemas/marketListing';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'market-list',
	description: 'List active marketplace items for this server',
	Category: 'Fun',
	type: ApplicationCommandType.ChatInput,
	run: async ({ interaction }) => {
		const guildId = interaction.guild?.id;
		const listings = await ListingModel.find({ guildID: guildId, active: true }).lean().exec();
		if (!listings || listings.length === 0) return interaction.reply({ content: 'No active listings.', ephemeral: true });

		const lines = listings.map(l => `${l._id} — ${l.itemName} x${l.quantity} @ ${l.price}g (seller: <@${l.sellerID}>)`);
		return interaction.reply({ content: lines.join('\n') });
	}
});
