import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } from 'discord.js';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'lock',
	description: 'Locks a channel so messages cant be sent',
	UserPerms: ['ManageChannels'],
	BotPerms: ['ManageChannels'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'time',
			description: 'Expire Date for this lockdown (1m, 1h, 1d)',
			type: ApplicationCommandOptionType.String,
			required: false
		},
		{
			name: 'reason',
			description: 'Provide a reason for this lockdown',
			type: ApplicationCommandOptionType.String,
			required: false
		}
	],

	// TEST: Needs testing to see if this reply with the function.
	run: async ({ interaction, client }) => {
		if (!interaction.inCachedGuild()) return;
		const { user, guild } = interaction;
		const owner = await guild?.fetchOwner();
		try {
			const constructionEmbed = new EmbedBuilder()
				.setTitle('Under Construction')
				.setAuthor({ name: user?.username, iconURL: user.displayAvatarURL() })
				.setColor('Green')
				.setThumbnail(user.displayAvatarURL({ size: 512 }))
				.setImage(guild?.iconURL({ size: 512, forceStatic: true }))
				.setDescription('This Command is currently Under Construction and should be available soon, thank you for your patients.')
				.setFooter({ text: owner?.displayName, iconURL: owner?.displayAvatarURL() })
				.setTimestamp();
			await interaction.reply({ embeds: [constructionEmbed], ephemeral: true });
		} catch (error) {
			console.error(error);
		}
	}
});