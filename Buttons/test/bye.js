module.exports = {
	id: 'bye',
	permission: 'MANAGE_MESSAGES',
	execute(interaction) {
		interaction.reply({ content: 'Im working here' });
	},
};
