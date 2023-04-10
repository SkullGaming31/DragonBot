import { ApplicationCommandType, EmbedBuilder } from 'discord.js';
import { Command } from '../../../src/Structures/Command';

export default new Command({
	name: 'unlock',
	description: 'unLocks a channel so messages can be sent',
	UserPerms: ['ManageChannels'],
	BotPerms: ['ManageChannels'],
	defaultMemberPermissions: ['ManageChannels'],
	type: ApplicationCommandType.ChatInput,

	run: async ({ interaction }) => {
		if (!interaction.inCachedGuild()) return;
		const { user, guild } = interaction;
		const owner = await guild.fetchOwner();
        

		const constructionEmbed = new EmbedBuilder()
			.setTitle('Under Construction')
			.setAuthor({ name: user?.username, iconURL: user.displayAvatarURL() })
			.setColor('Green')
			.setThumbnail(user.displayAvatarURL({ size: 512 }))
			.setImage(guild.iconURL({ size: 512, forceStatic: true }))
			.setDescription('This Command is currently Under Construction and should be available soon, thank you for your patients.')
			.setFooter({ text: owner.displayName, iconURL: owner.displayAvatarURL() })
			.setTimestamp();
		await interaction.reply({ embeds: [constructionEmbed] });

		/**
         * const { guild, channel } = interaction;

		const Embed = new EmbedBuilder();

		if (channel.permissionsFor(guild.id).has(['SendMessages'])) return interaction.reply({ embeds: [Embed.setColor(Colors.Red).setDescription('⛔ | this channel is already unlocked')], ephemeral: true });

		channel.permissionOverwrites.edit(guild.id, { SendMessages: null });
		await DB.deleteOne({ ChannelID: channel.id });

		interaction.reply({ embeds: [Embed.setColor(Colors.Green).setDescription('🔓 | The lockdown has been lifted')] });
         */
	}
});