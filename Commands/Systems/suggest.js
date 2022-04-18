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
		},
		{
			name: 'everyone',
			description: 'Should everyone be tagged in this poll',
			type: 'BOOLEAN',
			required: true
		}
	],
	/**
	 * 
	 * @param {CommandInteraction} interaction 
	 */
	async execute(interaction) {
		const { guildId, options, member } = interaction;

		const type = options.getString('type');
		const Everyone = options.getBoolean('everyone');
		const name = options.getString('name');
		const funcs = options.getString('functionality');

		const Response = new MessageEmbed()
			.setColor('RANDOM')
			.setDescription(`${member} has created a poll`)
			.addField('Name', `${name}`, false)
			.addField('Functionality', `${funcs}`, false);
		if (Everyone) {
			const message = await interaction.reply({ content: '<@&959693430227894292>', embeds: [Response], fetchReply: true, allowedMentions: ['ROLES'] });
			message.react('✅');
			message.react('❎');
		} else {
			const message = await interaction.reply({ embeds: [Response], fetchReply: true });
			message.react('✅');
			message.react('❎');
		}
	}
};