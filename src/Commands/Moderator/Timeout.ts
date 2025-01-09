import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder, MessageFlags } from 'discord.js';
import ms from 'ms';
import Database from '../../Database/Schemas/Infractions';
import { Command } from '../../Structures/Command';

/**
 * TODO:
 * list out all infraction for a user with reasons
 */

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
			case 'add':
				if (Length === null) return interaction.reply({ content: 'You must provide a length of time to time someone out.(1s,1m,1h,1d)', flags: MessageFlags.Ephemeral });
				if (Reason.length > 512) return interaction.reply({ content: 'You can not use more then 512 Characters for your reasoning', flags: MessageFlags.Ephemeral });
				if (!Target) return interaction.reply({ content: 'The Member most likely left the server', flags: MessageFlags.Ephemeral });

				// eslint-disable-next-line no-case-declarations
				const timeInMs = ms(Length) / 1000;
				if (!timeInMs) return interaction.reply({ content: 'Please specify a valid time(1s,1m,1h,1d)', flags: MessageFlags.Ephemeral });
				if (!ms(Length) || ms(Length) > ms('28d')) return interaction.reply({ content: 'Time Provided is invalid or over the 28d limit', flags: MessageFlags.Ephemeral });

				if (!Target.manageable || !Target.moderatable) return interaction.reply({ content: 'selected target is not moderatable by this bot', flags: MessageFlags.Ephemeral });
				if (member.roles.highest.position < Target.roles.highest.position) return interaction.reply({ content: 'selected member has a higher role position then you', flags: MessageFlags.Ephemeral });
				if (interaction.user.id === Target.user.id) return interaction.reply({ content: 'you can not timeout yourself', flags: MessageFlags.Ephemeral });

				try {
					await Target?.timeout(timeInMs, Reason).catch(async (err: any) => {
						await interaction.reply({ content: 'could not timeout the user due to an uncommon error', flags: MessageFlags.Ephemeral });
						return console.error(err);
					});

					const newInfraction = {
						IssuerID: member.id,
						IssuerTag: member.user.username,
						Reason: Reason,
						Date: Date.now()
					};
					let userData = await Database.findOne({ Guild: guild.id, User: Target.id });
					if (!userData) userData = await Database.create({ Guild: guild.id, User: Target.id, Infractions: [newInfraction] });
					else userData.Infractions.push(newInfraction) && await userData.save();


					const timedoutEmbed = new EmbedBuilder()
						.setTitle(`${Target?.displayName}`)
						.addFields(
							{ name: 'Timed Out for: ', value: `\`${timeInMs}\``, inline: false },
							{ name: 'Reason: ', value: `\`${Reason}\``, inline: false },
							{ name: 'Infraction Count: ', value: `\`${userData.Infractions.length} infractions recorded\``, inline: false }
						)
						.setColor(Colors.Red);
					return interaction.reply({ embeds: [timedoutEmbed] });

				} catch (error) {
					console.error(error);
					return;
				}
			case 'check':
				/**
					 * Pull Infraction Data(Object Array) from database and display in databaseEmbed
					 */
				// eslint-disable-next-line no-case-declarations
				const userData = await Database.findOne({ Guild: guild.id, User: Target?.id });
				if (!userData) return interaction.reply({ content: `No infractions found for ${Target}`, flags: MessageFlags.Ephemeral });

				// eslint-disable-next-line no-case-declarations
				const databaseEmbed = new EmbedBuilder()
					.setTitle('Display Data from Database')
					.setDescription(`${userData?.Infractions.forEach((data: any) => {
						data;
						/**
						 * Check Structures/Schemas/Infractions.ts for full details
						 * Infractions object[]
						 * Includes-
						 * IssuerID: string,
							 IssuerTag: string,
							 Reason: string,
							 Date: Date.now()
						 */
						// eslint-disable-next-line indent
						console.log({ data });
					})}`);
				interaction.reply({ embeds: [databaseEmbed] });
				break;
		}
	}
});