module.exports = {
	id: 'hello',
	permission: 'MANAGE_MESSAGES',
	execute(interaction) {
		interaction.reply({ content: 'Im working here' });
	},
};
