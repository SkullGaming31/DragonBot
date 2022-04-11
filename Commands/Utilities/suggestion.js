const {
	CommandInteraction,
	MessageEmbed,
	WebhookClient,
} = require('discord.js');
const DB = require('../../Structures/Schemas/SuggestDB');

module.exports = {
	name: 'suggestion',
	description: 'A way to send a suggestion to me for new features',
	permission: 'MANAGE_WEBHOOKS',
	options: [
		{
			name: 'type',
			description: 'select the type',
			type: 'STRING',
			required: true,
			choices: [
				{ name: 'Event', value: 'Event' },
				{ name: 'System', value: 'System' },
				{ name: 'Command', value: 'Command' },
				{ name: 'Other', value: 'Other' },
			],
		},
		{
			name: 'suggestion',
			description: 'describe your suggestion in 4096 characters or less',
			type: 'STRING',
			required: true,
		},
	],

	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	async execute(interaction) {
		const { options, guild, guildId, member, user } = interaction;

		const Type = options.getString('type');
		const Suggestion = options.getString('suggestion');

		const Response = new MessageEmbed()
			.setColor('PURPLE')
			.setAuthor({
				name: `${user.username}`,
				iconURL: `${user.displayAvatarURL({ dynamic: true })}`,
			})
			.addFields(
				{ name: 'Suggestion: ', value: Suggestion, inline: false },
				{ name: 'Type: ', value: Type, inline: true },
				{ name: 'User: ', value: user.tag },
				{ name: 'Guild: ', value: `${guild.name}`, inline: true }
			)
			.setFooter({ text: `${guild.id}` })
			.setTimestamp();

		try {
			await interaction.reply({
				content: 'Sent, Thank you for your Suggestion',
				ephemeral: true,
			});
			await DB.create({
				GuildID: guildId,
				Details: [
					{
						MemberID: member.id,
						Type: Type,
						Suggestion: Suggestion,
					},
				],
			});
			new WebhookClient({
				id: '961195913311838208',
				token:
					'HLBMu6HpnSNMVIDW5Mx1cBK3BOMfnMOub4z6UcTxIs0exl81Vr02t2mnKJweJHfXhadm',
			})
				.send({ embeds: [Response] })
				.catch((err) => {
					console.error(err);
				});
		} catch (error) {
			console.log(error);
		}
	},
};
