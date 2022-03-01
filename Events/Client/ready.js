const { Client } = require('discord.js');
const mongoose = require('mongoose');
const config = require('../../Structures/config');
const { mongoConnect } = require('../../database/index');

module.exports = {
	name: 'ready',
	once: true,
	/**
	 * @param {Client} client 
	 */
	async execute (client) {
		console.log(`Logged in as ${client.user.tag}`);
		client.user.setActivity('JavaScript', { type: 'WATCHING' });
		// client.guilds.cache.get(DISCORD_GUILD_ID).commands.set([]); // remove ALL commands
		await mongoConnect();
	},
};