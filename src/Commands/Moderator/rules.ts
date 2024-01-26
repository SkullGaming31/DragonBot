import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, EmbedBuilder, RoleResolvable } from 'discord.js';
import SettingsModel from '../../Database/Schemas/settingsDB';
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
		{
			name: 'title',
			description: 'Add the title of your Embed or leave it out for a default title',
			type: ApplicationCommandOptionType.String,
			required: false
		},
	],
	run: async ({ interaction, client }) => {
		const { options, guild, user } = interaction;
		const settings = await SettingsModel.findOne({ GuildID: guild?.id });
		// Get user-provided description, fields, and footer from the command interaction
		const userTitle = options.getString('title') || `${guild?.name} Rules`;
		const userDescription = options.getString('description');
		const userFields = options.getString('fields');
		const userFooter = options.getString('footer');

		const owner = await guild?.fetchOwner();
		// Create a new embed
		const embed = new EmbedBuilder().setTitle(`${guild?.name} Rules`).setAuthor({ name: `${owner?.displayName}`, iconURL: `${owner?.displayAvatarURL({ size: 512 })}` }).setTimestamp();

		// Set the title if provided by the user or use a default title
		if (userTitle) embed.setTitle(userTitle);

		// Set the description if provided by the user
		if (userDescription) embed.setDescription(userDescription);

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

		client.on('interactionCreate', async (interaction) => {
			//
			if (interaction.isButton()) {
				// Check if the button custom ID is 'accept'
				if (interaction.customId === 'accept') {
					// Check if the interaction is in the "rules" channel
					const data = settings?.rulesChannel;
					const rulesChannelId = data;
					if (interaction.channelId !== rulesChannelId) return;

					// Get the role ID from settings
					const roleId: RoleResolvable | undefined = settings?.MemberRole;

					if (roleId) {
						const member = interaction.guild?.members.cache.get(user?.id);

						if (member) {
							const role = interaction.guild?.roles.cache.get(roleId);

							if (role) {
								if (member.roles.cache.has(roleId)) {
									try {
										await member.roles.remove(role);
										await interaction.reply({ content: 'Role removed successfully!', ephemeral: true });
									} catch (error) {
										console.error('Error removing role:', error);
										await interaction.reply({ content: 'An error occurred while removing the role.', ephemeral: true });
									}
								} else {
									try {
										await member.roles.add(role);
										await interaction.reply({ content: 'Role assigned successfully!', ephemeral: true });
									} catch (error) {
										console.error('Error assigning role:', error);
										await interaction.reply({ content: 'An error occurred while assigning the role.', ephemeral: true });
									}
								}
							} else {
								await interaction.reply({ content: 'Role not found in the server.', ephemeral: true });
							}
						} else {
							await interaction.reply({ content: 'Member not found.', ephemeral: true });
						}
					} else {
						const owner = await interaction.guild?.fetchOwner({ cache: true });
						if (user.id !== owner?.id) {
							await interaction.reply({ content: 'Role ID not found in settings. Please contact an admin to assign the role.', ephemeral: true });
						} else {
							await interaction.reply({ content: 'Role ID not found in settings. Please use the `/settings` commands to set it', ephemeral: true });
						}
					}
				}
			}
		});
	},
});