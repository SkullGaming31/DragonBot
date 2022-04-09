const { Client } = require('discord.js');
// const mongoose = require('mongoose');
// const config = require('../../Structures/config');
const { mongoConnect } = require('../../database/index');

module.exports = {
	name: 'ready',
	once: true,
	/**
	 * @param {Client} client 
	 */
	async execute(client) {
		console.log(`Logged in as ${client.user.tag}`);
		client.user.setActivity('Overlay Experts', { type: 'WATCHING' });
		// client.guilds.cache.get(config.DISCORD_GUILD_ID).commands.set([]); // remove ALL commands
		await mongoConnect();
		require('../../Structures/Systems/ChatFilterSys')(client);
		require('../../Structures/Systems/LockdownSys')(client);
	},
};