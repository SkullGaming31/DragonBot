import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { Command } from '../../Structures/Command';

// Define an interface for the field object
interface EmbedField {
	name: string;
	value: string;
	inline: boolean;
}

export default new Command({
	name: 'rules',
	description: 'Set the rules for your discord server',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'description',
			description: 'Description for the embed',
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: 'fields',
			description: 'Fields for the embed',
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: 'footer',
			description: 'Footer for the embed',
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	],
	run: async ({ interaction }) => {
		// Get user-provided description, fields, and footer from the command interaction
		const userDescription = interaction.options.getString('description');
		const userFields = interaction.options.getString('fields');
		const userFooter = interaction.options.getString('footer');

		const owner = await interaction.guild?.fetchOwner();
		// Create a new embed
		const embed = new EmbedBuilder().setTitle(`${interaction.guild?.name} Rules`).setAuthor({ name: `${owner?.displayName}`, iconURL: `${owner?.displayAvatarURL({ size: 512 })}` }).setTimestamp();

		// Set the description if provided by the user
		if (userDescription) {
			embed.setDescription(userDescription);
		}

		// Set fields if provided by the user
		if (userFields) {
			try {
				// Split the provided fields into an array using a semicolon as a separator
				const fieldEntries: string[] = userFields.split(';');

				// Create an array to store field objects
				const fields: EmbedField[] = [];

				// Iterate through field entries and parse them
				fieldEntries.forEach((fieldEntry) => {
					const [name, value, inlineStr] = fieldEntry.split('|');
					if (name && value) {
						const field: EmbedField = {
							name: name.trim(),
							value: value.trim(),
							inline: inlineStr ? inlineStr.trim().toLowerCase() === 'true' : false,
						};
						fields.push(field);
					}
				});

				// Add the parsed fields to the embed
				embed.addFields(fields.map((field) => ({
					name: field.name,
					value: field.value,
					inline: field.inline,
				})));
			} catch (error) {
				console.error('Error parsing fields:', error);
			}
		}

		// Set the footer if provided by the user
		if (userFooter) {
			embed.setFooter({ text: userFooter });
		}

		// Create an accept button
		const acceptButton = new ButtonBuilder()
			.setEmoji('<:check:781572995469934622>')
			.setCustomId('accept')
			.setLabel('Accept')
			.setStyle(ButtonStyle.Primary);

		// Create an action row to contain the button
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(acceptButton);

		// Send the embed with the accept button
		await interaction.reply({ embeds: [embed], components: [row] });
	},
});