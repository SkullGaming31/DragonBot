const { CommandInteraction } = require('discord.js');
module.exports = {
	name: 'interactionCreate',
	/**
	 * 
	 * @param {CommandInteraction} interaction 
	 * @returns 
	 */
	async execute(interaction) {
		if (interaction.channel.type === 'DM') return;
		console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`);
		if (!interaction.isCommand()) return;

		const command = interaction.client.commands.get(interaction.commandName); // this will read commands from there own .js file

		try {
			await command.execute(interaction);
		}
		catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	},
};