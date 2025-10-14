import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder } from 'discord.js';
import { Command } from '../../Structures/Command';
import { ListingModel } from '../../Database/Schemas/marketListing';

export default new Command({
	name: 'market-list',
	description: 'View marketplace listings',
	Category: 'Fun',
	type: ApplicationCommandType.ChatInput,
	options: [
		{ name: 'seller', description: 'Optional seller id to filter', type: ApplicationCommandOptionType.String, required: false }
	],
	run: async ({ interaction }) => {
		const { guild, options } = interaction;
		if (!guild) return interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });

		const seller = options.getString('seller');
    type ListingQuery = { guildID: string; active?: boolean; sellerID?: string };
    const query: ListingQuery = { guildID: guild.id, active: true };
    if (seller) query.sellerID = seller;

    const listings = await ListingModel.find(query).sort({ createdAt: -1 }).limit(50).lean().exec();
    if (!listings || listings.length === 0) return interaction.reply({ content: 'No listings found.', ephemeral: true });

    const embed = new EmbedBuilder()
    	.setTitle('Marketplace Listings')
    	.setDescription(`Found ${listings.length} listing(s)`)
    	.setColor('Blue');

    for (const l of listings) {
    	embed.addFields({ name: `${l.itemName} — ${l.quantity}x @ ${l.price}g`, value: `ID: ${l._id} • Seller: <@${l.sellerID}>`, inline: false });
    }

    return interaction.reply({ embeds: [embed], ephemeral: false });
	}
});
