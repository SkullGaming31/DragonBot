const { CommandInteraction, MessageEmbed } = require('discord.js');

module.exports = {
	name: 'ping',
	description: 'Returns Pong',
	permission: 'ADMINISTRATOR',

	/**
	* @param {CommandInteraction} interaction
	* @returns
	*/
	async execute(interaction) {
		const { user } = interaction;
		// const memberPermissions = member.permissions.toArray();
		// const rolePermissions = role.permissions.toArray();
		// console.log('Member Permissions: ' + memberPermissions);
		// console.log('Role Permissions: ' + rolePermissions);

		const pingEmbed = new MessageEmbed()
			.setTitle('/ping')
			.setThumbnail(`${user.displayAvatarURL({ dynamic: true })}`)
			.addField('**Ping**: ', `\`${interaction.client.ws.ping}ms\``, true)
			.setColor('GREEN');
		await interaction.deferReply();
		interaction.editReply({	embeds: [pingEmbed] });
	}
};