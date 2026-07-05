import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, EmbedBuilder, MessageFlags, TextChannel } from 'discord.js';
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
			name: 'type',
			description: 'Give a brief description of your issue',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{ name: 'Bug', value: 'bug' },
				{ name: 'Feature', value: 'feature' },
				{ name: 'Member Report', value: 'member report' },
				{ name: 'Other', value: 'other' }
			]
		},
		{
			name: 'issue',
			description: 'Give a brief description of your issue',
			type: ApplicationCommandOptionType.String,
			required: true
		},
		{
			name: 'email',
			description: 'Give a brief description of your issue',
			type: ApplicationCommandOptionType.String,
			required: false
		}
	],
	run: async ({ interaction, client }) => {
		const { user, options, guild } = interaction;
		const botName = client.user?.tag;
		const Contact = options.getBoolean('contact');
		const typeVal = options.getString('type');
		const email = options.getString('email');
		const issueText = options.getString('issue');

		// map selected choice values to readable labels
		const normalizedType = (typeVal || '').toLowerCase().trim();
		const typeLabel = normalizedType === 'bug' ? 'Bug' : normalizedType === 'feature' ? 'Feature' : normalizedType === 'member report' ? 'Member Report' : (typeVal || 'Other');

		// find a likely ticket channel in the guild (by name containing 'ticket')
		const ticketChannel = guild?.channels.cache.find(c => /ticket/i.test(c.name || '')) as TextChannel | undefined;

		const constructionEmbed = new EmbedBuilder()
			.setTitle(`${botName} helpdesk`)
			.setAuthor({ name: `${user.globalName}`, iconURL: `${user.displayAvatarURL({ size: 512 })}` })
			.setDescription('This command is still a work in progress');

		const contactEmbed = new EmbedBuilder()
			.setTitle(`${botName} helpdesk`)
			.setAuthor({ name: `${user.globalName}`, iconURL: `${user.displayAvatarURL({ size: 512 })}` })
			.setDescription('Support request');
		// always include the selected type
		if (typeLabel) contactEmbed.addFields({ name: 'Type', value: typeLabel, inline: true });
		if (issueText) contactEmbed.addFields({ name: 'Issue', value: issueText.slice(0, 1000) });
		// TODO: look for a mod-mail channel in the database and use that instead of hardcoding a channel ID
		// currently hardcoded to a specific channel in the support server since this is a support-focused command
		const contactChannel = guild?.channels.cache.get('1513731575307833364');
		if (typeLabel === 'Member Report') {
			const mention = ticketChannel ? `<#${ticketChannel.id}>` : 'the ticket channel';
			await interaction.reply({ content: `Member reports must be submitted through the ticket system — please open a ticket in ${mention} and include the details.`, flags: MessageFlags.Ephemeral });
			return;
		}

		let delivered = false;
		if (contactChannel?.type === ChannelType.GuildText) {
			if (Contact && email) contactEmbed.addFields({ name: 'Email', value: email });
			const ch = contactChannel as TextChannel;
			try {
				await ch.send({ embeds: [contactEmbed] });
				delivered = true;
			} catch (err) {
				console.error('Failed to send help embed to contact channel', err);
			}
		}

		const ack = delivered
			? `${user.globalName}, your request has been submitted and sent to the moderation team.` + (Contact && email ? ` We'll contact you at ${email}.` : '')
			: `${user.globalName}, your request was received but I couldn't deliver it to the moderation channel. Please contact a moderator directly.`;

		await interaction.reply({ content: ack, flags: MessageFlags.Ephemeral });
	}
});