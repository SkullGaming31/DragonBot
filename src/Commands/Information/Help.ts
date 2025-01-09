import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, EmbedBuilder, MessageFlags } from 'discord.js';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'help',
	description: 'get help with using the discord bot',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	Category: 'Information',
	options: [
		{
			name: 'contact',
			description: 'Would you like someone to contact you about this issue?',
			type: ApplicationCommandOptionType.Boolean,
			required: true
		},
		{
			name: 'issue',
			description: 'Give a brief description of your issue',
			type: ApplicationCommandOptionType.String,
			required: false
		}
	],
	run: async ({ interaction, client }) => {
		const { user, options, guild } = interaction;
		const Contact = options.getBoolean('contact');

		const constructionEmbed = new EmbedBuilder()
			.setTitle(`${client.user?.globalName}, helpdesk`)
			.setAuthor({ name: `${user.globalName}`, iconURL: `${user.displayAvatarURL({ size: 512 })}` })
			.setDescription('This command is still a work in progress');

		const contactEmbed = new EmbedBuilder()
			.setTitle(`${client.user?.globalName}, helpdesk`)
			.setAuthor({ name: `${user.globalName}`, iconURL: `${user.displayAvatarURL({ size: 512 })}` })
			.setDescription('test');
		const contactChannel = guild?.channels.cache.get('1080703340549242970');
		if (Contact === true) {
			if (contactChannel?.type === ChannelType.GuildText) {
				await interaction.reply({ embeds: [contactEmbed] });
			}
			await interaction.reply({ content: `${user.globalName}, your request has been submited and someone will get back to you as soon as possible.`, flags: MessageFlags.Ephemeral });
		} else {
			await interaction.reply({ embeds: [constructionEmbed], flags: MessageFlags.Ephemeral });
		}
	}
});