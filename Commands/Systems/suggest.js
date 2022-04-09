const { CommandInteraction, MessageEmbed } = require('discord.js');

module.exports = {
	name: 'poll',
	description: 'create a poll for everyone to vote on',
	permission: 'MANAGE_MESSAGES',
	options: [
		{
			name: 'type',
			description: 'select the type.',
			required: true,
			type: 'STRING',
			choices: [
				{
					name: 'Other',
					value: 'Other'
				}
			]
		},
		{
			name: 'name',
			description: 'provide a name for your poll',
			type: 'STRING',
			required: true
		},
		{
			name: 'functionality',
			description: 'Describe how it should work',
			type: 'STRING',
			required: true
		}
	],
	/**
	 * 
	 * @param {CommandInteraction} interaction 
	 */
	async execute(interaction) {
		const { options, member } = interaction;

		const type = options.getString('type');
		const name = options.getString('name');
		const funcs = options.getString('functionality');

		const Response = new MessageEmbed()
			.setColor('BLUE')
			.setDescription(`${member} has suggested a ${type}.`)
			.addField('Name', `${name}`, true)
			.addField('Functionality', `${funcs}`, true);
		const message = await interaction.reply({ embeds: [Response], fetchReply: true });
		message.react('✅');
		message.react('❎');
	}
};