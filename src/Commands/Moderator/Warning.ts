
import crypto from 'crypto';
import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, User } from 'discord.js';
import DB from '../../Database/Schemas/WarnDB';
import { Command } from '../../Structures/Command';

// Function to generate a random unique ID
function generateUniqueID(): string {
	return crypto.randomBytes(8).toString('hex');
}

export default new Command({
	name: 'warn',
	description: 'Warns, removes, or checks warnings for a user',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,
	Category: 'Moderator',
	options: [
		{
			name: 'subcommand',
			description: 'Subcommands for warning',
			type: ApplicationCommandOptionType.SubcommandGroup,
			options: [
				{
					name: 'add',
					description: 'Add a warning to a user',
					type: ApplicationCommandOptionType.Subcommand,
					options: [
						{
							name: 'target',
							description: 'Select a target',
							type: ApplicationCommandOptionType.User,
							required: true,
						},
						{
							name: 'reason',
							description: 'Provide a reason for giving this warning',
							type: ApplicationCommandOptionType.String,
							required: false,
						},
					],
				},
				{
					name: 'remove',
					description: 'Remove warnings from a user',
					type: ApplicationCommandOptionType.Subcommand,
					options: [
						{
							name: 'target',
							description: 'Select a target',
							type: ApplicationCommandOptionType.User,
							required: true,
						},
						{
							name: 'warning_id', // Change the option name to "warning_id"
							description: 'Specify the ID of the warning to remove',
							type: ApplicationCommandOptionType.String, // Assuming the warning ID is a string
							required: true,
						},
					],
				},
				{
					name: 'check',
					description: 'Check the warnings for a user',
					type: ApplicationCommandOptionType.Subcommand,
					options: [
						{
							name: 'target',
							description: 'Select a target',
							type: ApplicationCommandOptionType.User,
							required: true,
						},
					],
				},
			],
		},
	],

	run: async ({ interaction }) => {
		if (!interaction.inCachedGuild()) return;

		const { options, guild, member } = interaction;
		const Target = options.getUser('target') as User | null;
		const Reason = options.getString('reason') || 'No Reason Provided';
		const warningID = options.getString('warning_id');

		switch (options.getSubcommand()) {
			case 'remove':
				// Logic for removing a specific warning
				if (!member?.permissions.has('ManageMessages')) {
					interaction.reply({ content: 'You do not have permission to remove warnings.' });
					return;
				}

				if (!warningID) {
					interaction.reply({ content: 'Invalid warning ID provided.' });
					return;
				}

				// Check if the user is in the warnings database
				const userWarningsToRemove = await DB.findOne({ GuildID: guild.id, UserID: Target?.id });

				if (!userWarningsToRemove || userWarningsToRemove.Warnings.length === 0) {
					interaction.reply({ content: `No warnings found for ${Target?.globalName}.` });
				} else {
					// Filter out the warning with the specified ID
					userWarningsToRemove.Warnings = userWarningsToRemove.Warnings.filter((warning) => warning.WarningID !== warningID);

					await userWarningsToRemove.save();

					interaction.reply({
						content: `Warning with ID \`${warningID}\` removed for ${Target?.globalName}. New warning count: ${userWarningsToRemove.Warnings.length}.`,
					});
				}
				break;

			case 'check':
				// Logic for checking warnings
				const userWarnings = await DB.findOne({ GuildID: guild.id, UserID: Target?.id });
				if (!userWarnings || userWarnings.Warnings.length === 0) {
					const display = Target ? (Target.bot ? Target.tag : (Target.username ?? Target.tag)) : 'that user';
					interaction.reply({ content: `No warnings found for ${display}.` });
				} else {
					const warningEmbed = new EmbedBuilder()
						.setTitle(`${Target?.globalName}'s Warnings`)
						.setColor('Yellow');

					// Iterate through the warning reasons and add each one as a field
					userWarnings.Warnings.forEach((warning, index) => {
						const warningField = {
							name: `Warning ${index + 1} (ID: ${warning.WarningID}, Source: ${warning.Source})`,
							value: warning.Reason || 'No reason provided',
							inline: false,
						};
						warningEmbed.addFields(warningField);
					});

					interaction.reply({ embeds: [warningEmbed] });
				}

				break;
			case 'add':
				// Check to see if the user is already in the warnings database
				const existingWarning = await DB.findOne({ GuildID: guild.id, UserID: Target?.id });

				if (existingWarning) {
					// Increment their warning count in the Database.
					const newWarning = {
						WarningID: generateUniqueID(), // Generate a unique ID for the new warning
						Reason: Reason,
						Source: 'user', // Set the source to "user" for user-added warnings
					};
					existingWarning.Warnings.push(newWarning); // Add the new warning to the array
					await existingWarning.save();
					interaction.reply({
						content: `Added a warning for ${Target?.globalName}. They now have ${existingWarning.Warnings.length} warnings.`,
					});
				} else {
					// If the user does not have a warning, create a new warning entry in the database
					const newWarning = new DB({
						GuildID: guild.id,
						UserID: Target?.id,
						Warnings: [
							{
								WarningID: generateUniqueID(), // Generate a unique ID for the new warning
								Reason: Reason,
								Source: 'user', // Set the source to "user" for user-added warnings
							},
						],
					});
					await newWarning.save();
					await interaction.reply({ content: `${Target?.globalName} has been warned. They now have their first warning for Reason: ${Reason}` });
				}
				break;
			default:
				await interaction.reply({ content: 'Invalid subcommand. Please use one of the available subcommands.' });
				break;
		}
	},
});