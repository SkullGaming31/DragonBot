const { CommandInteraction, MessageEmbed, WebhookClient } = require('discord.js');
const config = require('../../Structures/config');

module.exports = {
	name: 'warn',
	description: 'Send a warning to a member of the guild',
	permission: 'MANAGE_MESSAGES',
	options: [
		{
			name: 'target',
			description: 'the user you want to timeout',
			type: 'USER',
			required: true
		},
		{
			name: 'reason',
			description: 'reason for sending a warning to the user',
			type: 'STRING',
			required: true
		}
	],
	/**
   * @param {CommandInteraction} interaction 
   */
	async execute(interaction) {
		const { options, user } = interaction;

		const Target = options.getMember('target');
		let reason = options.getString('reason');

		try {
			await interaction.deferReply();

			const logsEmbed = new MessageEmbed()
				.setTitle(`${Target.displayName}`)
				.addFields([
					{
						name: 'Command Issuer: ',
						value: `\`${user.username}\``,
						inline: true
					},
					{
						name: 'Target',
						value: `\`${Target.displayName}\``,
						inline: true
					},
					{
						name: 'Reason: ',
						value: `\`${reason}\``,
						inline: true
					}
				])
				.setColor('RED');

			const timedoutEmbed = new MessageEmbed()
				.setAuthor({ name: `${Target.displayName}` })
				.addFields([
					{
						name: 'Warning For: ',
						value: `\`${reason}\``,
						inline: true
					}
				])
				.setColor('RED');
			interaction.editReply({ content: `${Target}`, embeds: [timedoutEmbed] });
			new WebhookClient({ url: 'https://discord.com/api/webhooks/944405199102025790/BUULFqS4comn99ZZwkU71DLyHdPtT3wmIST_47HjqTLd8mJqJcL5Hc9OoO4VNq12acnS'}
			).send({ embeds: [logsEmbed]}).catch((err) => {
				console.error(err);
			});
		} catch (error) {
			console.error(error);
		}
	}
};