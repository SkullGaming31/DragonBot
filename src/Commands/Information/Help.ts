import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder } from 'discord.js';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'help',
	description: 'get help with using the discord bot',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	Development: true,
	options: [
		{
			name: 'contact',
			description: 'Would you like someone to contact you about this issue?',
			type: ApplicationCommandOptionType.Boolean,
			required: false
		}
	],
	run: async ({ interaction, client }) => {
		const { user, options } = interaction;
		const Contact = options.getBoolean('contact');
		const constructionEmbed = new EmbedBuilder()
			.setTitle(`${client.user?.globalName}, helpdesk`)
			.setAuthor({ name: `${user.globalName}`, iconURL: `${user.displayAvatarURL({ size: 512 })}` })
			.setDescription('This command is still a work in progress');
		if (Contact === true) {
			await interaction.reply({ content: `${user.globalName}, your request has been submited and someone will get back to you as soon as possible.`, ephemeral: true });
		} else {
			await interaction.reply({ embeds: [constructionEmbed], ephemeral: true });
		}
	}
});