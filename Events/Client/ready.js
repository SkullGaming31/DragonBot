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
		const tbd = await client.guilds.fetch();
		client.user.setActivity('/get-help', { type: 'WATCHING' });
		await mongoConnect();
		require('../../Structures/Systems/ChatFilterSys')(client);
		require('../../Structures/Systems/LockdownSys')(client);
	},
};