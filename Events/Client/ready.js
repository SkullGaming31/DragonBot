const { Client, ActivityType } = require('discord.js');
const { MONGO_DATABASE, MONGO_PASSWORD, MONGO_USERNAME, MONGO_DATABASE_URI } = require('../../Structures/config');
const mongoose = require('mongoose');
const ms = require('ms');

module.exports = {
	name: 'ready',
	once: true,
	/**
 * 
 * @param {Client} client 
 * @returns
 */
	async execute(client) {
		const { user, ws } = client;
		console.log(`${client.user.tag} is online!`);
		setInterval(() => {
			const ping = ws.ping;

			user.setActivity({ name: ` Ping: ${ping}ms`, type: ActivityType.Watching });

		}, ms('1m'));

		if (!MONGO_DATABASE_URI) return;
		await mongoose.connect(MONGO_DATABASE_URI, {
			user: MONGO_USERNAME,
			pass: MONGO_PASSWORD,
			dbName: MONGO_DATABASE,
			connectTimeoutMS: 10000,
			useNewUrlParser: true,
			useUnifiedTopology: true
		}).then(() => {
			console.log('Database Connected');
		}).catch((err) => {
			console.log(err);
		});
	}
};