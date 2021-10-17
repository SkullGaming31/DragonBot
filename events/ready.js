const deploy = require('../deploy-commands');
module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		console.log(`Logged in as ${client.user.tag}`);
	},
};