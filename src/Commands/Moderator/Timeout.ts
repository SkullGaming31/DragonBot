import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder, MessageFlags } from 'discord.js';
import ms, { StringValue } from 'ms';
import Database from '../../Database/Schemas/Infractions';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'timeout',
	description: 'Timeout a user from sending messages or joining any voice channel',
	UserPerms: ['ModerateMembers'],
	BotPerms: ['ModerateMembers'],
	defaultMemberPermissions: ['ModerateMembers'],
	type: ApplicationCommandType.ChatInput,
	Category: 'Moderator',
	options: [
		{
			name: 'option',
			description: 'check or add infractions to a user',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{ name: 'add', value: 'add' },
				{ name: 'check', value: 'check' }
			]
		},
		{
			name: 'target',
			description: 'the user you want to timeout',
			type: ApplicationCommandOptionType.User,
			required: true
		},
		{
			name: 'length',
			description: 'how long do you want to timeout the user(1s,1m,1h,1d)',
			type: ApplicationCommandOptionType.String,
			required: false
		},
		{
			name: 'reason',
			description: 'reason for timing out the user',
			type: ApplicationCommandOptionType.String
		}
	],
	run: async ({ interaction }) => {
		if (!interaction.inCachedGuild()) return;

		const { options, guild, member } = interaction;
		const Choice = options.getString('option');
		const Target = options.getMember('target');
		const Length = options.getString('length');
		const Reason = options.getString('reason') || 'No Reason Provided';

		switch (Choice) {
			case 'add': {
				// Validate length first
				if (!Length) return interaction.reply({
					content: 'You must provide a length of time to time someone out.(1s,1m,1h,1d)',
					flags: MessageFlags.Ephemeral
				});

				// Validate time format
				const timeFormatRegex = /^[1-9]\d*[smhd]$/;
				if (!timeFormatRegex.test(Length)) {
					return interaction.reply({
						content: 'Invalid time format. Use 1s, 1m, 1h, or 1d',
						flags: MessageFlags.Ephemeral
					});
				}

				// Convert to milliseconds
				const durationMs = ms(Length as StringValue);
				if (!durationMs || durationMs > ms('28d')) {
					return interaction.reply({
						content: 'Invalid duration or exceeds 28-day limit',
						flags: MessageFlags.Ephemeral
					});
				}

				// Validate other parameters
				if (Reason.length > 512) return interaction.reply({
					content: 'Reason cannot exceed 512 characters',
					flags: MessageFlags.Ephemeral
				});

				if (!Target) return interaction.reply({
					content: 'Target member not found',
					flags: MessageFlags.Ephemeral
				});

				// Permission checks
				if (!Target.manageable || !Target.moderatable) return interaction.reply({
					content: 'Cannot moderate this user',
					flags: MessageFlags.Ephemeral
				});

				if (member.roles.highest.position <= Target.roles.highest.position) return interaction.reply({
					content: 'Target has equal or higher role position',
					flags: MessageFlags.Ephemeral
				});

				if (interaction.user.id === Target.user.id) return interaction.reply({
					content: 'You cannot timeout yourself',
					flags: MessageFlags.Ephemeral
				});

				try {
					// Apply timeout
					await Target.timeout(durationMs, Reason);

					// Update database
					const newInfraction = {
						IssuerID: member.id,
						IssuerTag: member.user.bot ? member.user.tag : (member.user.globalName || member.user.username || member.user.tag),
						Reason: Reason,
						Date: Date.now()
					};

					let userData = await Database.findOne({ Guild: guild.id, User: Target.id });

					if (!userData) {
						userData = await Database.create({
							Guild: guild.id,
							User: Target.id,
							Infractions: [newInfraction]
						});
					} else {
						userData.Infractions.push(newInfraction);
						await userData.save();
					}

					// Create embed with human-readable duration
					const durationDisplay = ms(durationMs, { long: true });
					const timedoutEmbed = new EmbedBuilder()
						.setTitle(`${Target.displayName} Timed Out`)
						.addFields(
							{ name: 'Duration', value: `\`${durationDisplay}\``, inline: true },
							{ name: 'Reason', value: `\`${Reason}\``, inline: true },
							{ name: 'Total Infractions', value: `\`${userData.Infractions.length}\``, inline: true }
						)
						.setColor(Colors.Red)
						.setTimestamp();

					return interaction.reply({ embeds: [timedoutEmbed] });

				} catch (error) {
					console.error('Timeout Error:', error);
					return interaction.reply({
						content: 'Failed to timeout user due to an error',
						flags: MessageFlags.Ephemeral
					});
				}
			}

			case 'check': {
				if (!Target) return interaction.reply({
					content: 'User not found',
					flags: MessageFlags.Ephemeral
				});

				const userData = await Database.findOne({
					Guild: guild.id,
					User: Target.id
				});

				if (!userData?.Infractions.length) return interaction.reply({
					content: `No infractions found for ${Target.user.globalName}`,
					flags: MessageFlags.Ephemeral
				});

				const infractionsList = userData.Infractions
					.map((inf, index) =>
						`**#${index + 1}** - ${ms(Date.now() - inf.Date, { long: true })} ago\n` +
						`**Moderator:** ${inf.IssuerTag}\n` +
						`**Reason:** ${inf.Reason}`
					)
					.join('\n\n');

				const databaseEmbed = new EmbedBuilder()
					.setTitle(`${Target.user.globalName}'s Infractions`)
					.setDescription(infractionsList)
					.setColor(Colors.Orange)
					.setFooter({ text: `Total Infractions: ${userData.Infractions.length}` })
					.setTimestamp();

				return interaction.reply({ embeds: [databaseEmbed] });
			}
		}
	}
});