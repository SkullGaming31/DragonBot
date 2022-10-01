import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, Colors } from 'discord.js';
import { Command } from '../../../src/Structures/Command';
import DB from '../../Structures/Schemas/WarnDB';

export default new Command({
	name: 'warning',
	description: 'Shows user warnings',
	UserPerms: ['KickMembers'],
	BotPerms: ['KickMembers'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'add',
			description: 'Adds a warning.',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'target',
					description: 'Select a target',
					type: ApplicationCommandOptionType.User,
					required: true
				},
				{
					name: 'evidence',
					description: 'Provide an evidence',
					type: ApplicationCommandOptionType.String,
					required: false
				},
				{
					name: 'reason',
					description: 'Provide a reason',
					type: ApplicationCommandOptionType.String,
					required: false
				}
			]
		},
		{
			name: 'check',
			description: 'Checks the warnings.',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'target',
					description: 'Select a target',
					type: ApplicationCommandOptionType.User,
					required: true
				},
			]
		},
		{
			name: 'remove',
			description: 'Removes a warning.',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'target',
					description: 'Select a target',
					type: ApplicationCommandOptionType.User,
					required: true
				},
				{
					name: 'warnid',
					description: 'Provide the warning ID',
					type: ApplicationCommandOptionType.Number,
					required: true
				},
			]
		},
		{
			name: 'clear',
			description: 'Clears all warnings.',
			type: ApplicationCommandOptionType.Subcommand,
			options: [
				{
					name: 'target',
					description: 'Select a target',
					type: ApplicationCommandOptionType.User,
					required: true
				},
			]
		},
	],
	run: async ({ interaction }) => {
		if (!interaction.inCachedGuild()) return;

		const { options, guildId, user, guild } = interaction;
		const Sub = options.getSubcommand(true);
		const Target = options.getMember('target');
		const Reason = options.getString('reason') || 'No Reason Provided';
		const Evidence = options.getString('evidence') || 'No Evidence Provided.';
		const WarnID = options.getNumber('warnid', true) - 1;
		const WarnDate = new Date(interaction.createdTimestamp).toLocaleDateString();

		if (Sub === 'add') {
			DB.findOne({ GuildID: guildId, UserID: Target?.id, UserTag: Target?.user.tag }, async (err: any, data: any) => {
				if (err) throw err;
				if (!data) {
					data = new DB({
						GuildID: guildId,
						UserID: Target?.id,
						UserTag: Target?.user.tag,
						Content: [
							{
								ExecuterID: user.id,
								ExecuterTag: user.tag,
								Reason: Reason,
								Evidence: Evidence,
								Date: WarnDate
							}
						],
					});
				} else {
					const obj = {
						ExecuterID: user.id,
						ExecuterTag: user.tag,
						Reason: Reason,
						Evidence: Evidence,
						Date: WarnDate
					};
					data.Content.push(obj);
				}
				data.save();
			});

			interaction.reply({
				embeds: [new EmbedBuilder()
					.setTitle('Warning added')
					.setColor(Colors.Blurple)
					.setDescription(`Warning Added: ${Target?.user.tag} \n**Reason**: ${Reason}\n**Evidence**: ${Evidence}`)
					.setFooter({ text: `ID: ${Target?.id}` })

				]
			});
			try {
				await Target?.send({
					embeds: [new EmbedBuilder()
						.setColor(Colors.Aqua)
						.setTitle('⚠️ WARNING')
						.setAuthor({ name: Target?.user.tag, iconURL: Target?.user.avatarURL({ size: 512 }) ?? undefined })
						.setDescription(`You have been warned for: \`\`\`${Reason}\`\`\` \nServer Name: **${guild.name}**`)
						.setFooter({ text: `ID: ${Target?.user.id}` })
					]
				});
			} catch (error) {
				console.log('User has DMs turned off\n', error);
				return;
			}


		} else if (Sub === 'check') {
			DB.findOne({ GuildID: guildId, UserID: Target?.id, UserTag: Target?.user.tag }, async (err: any, data: any) => {
				if (err) throw err;
				if (data) {
					interaction.reply({
						embeds: [new EmbedBuilder()
							.setTitle('Warnings Check')
							.setColor(Colors.Blurple)
							.setDescription(`${data.Content.map(
								(w: any, i: any) => `**ID**: ${i + 1}\n**By**: ${w.ExecuterTag}\n**Date**: ${w.Date}\n**Reason**: ${w.Reason}\n**Evidence**: ${w.Evidence}\n\n`
							).join(' ')}`)]
					});
				} else {
					interaction.reply({
						embeds: [new EmbedBuilder()
							.setTitle('Warnings Check')
							.setColor(Colors.Blurple)
							.setDescription(`${Target?.user.tag} has no warnings.`)
							.setFooter({ text: `ID: ${Target?.id}` })
						]
					});

				}
			});

		} else if (Sub === 'remove') {
			DB.findOne({ GuildID: guildId, UserID: Target?.id, UserTag: Target?.user.tag }, async (err: any, data: any) => {
				if (err) throw err;
				if (data) {
					data.Content.splice(WarnID, 1);
					interaction.reply({
						embeds: [new EmbedBuilder()
							.setTitle('Removed')
							.setColor(Colors.Blurple)
							.setDescription(`${Target?.user.tag}'s warning id: ${WarnID + 1} has been removed.`)]
					});
					data.save();
				} else {
					interaction.reply({
						embeds: [new EmbedBuilder()
							.setTitle('WARNING')
							.setColor(Colors.Blurple)
							.setDescription(`${Target?.user.tag} has no warnings.`)
							.setFooter({ text: `ID: ${Target?.id}` })
						]
					});
				}
			});

		} else if (Sub === 'clear') {

			DB.findOne({ GuildID: guildId, UserID: Target?.id, UserTag: Target?.user.tag }, async (err: any, data: any) => {
				if (err) throw err;
				if (data) {
					await DB.findOneAndDelete({ GuildID: guildId, UserID: Target?.id, UserTag: Target?.user.tag });
					interaction.reply({
						embeds: [new EmbedBuilder()
							.setTitle('WARNING')
							.setColor(Colors.Blurple)
							.setDescription(`${Target?.user.tag}'s warnings have been cleared`)
							.setFooter({ text: `ID: ${Target?.id}` })
						]
					});
				} else {
					interaction.reply({
						embeds: [new EmbedBuilder()
							.setTitle('WARNING')
							.setColor(Colors.Blurple)
							.setDescription(`${Target?.user.tag} has no warnings.`)
							.setFooter({ text: `ID: ${Target?.id}` })
						]
					});
				}
			});
		}
	}
});