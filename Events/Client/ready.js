const { Client, ActivityType } = require('discord.js');
const { MONGO_DATABASE, MONGO_PASSWORD, MONGO_USERNAME, MONGO_DATABASE_URI } = require('../../Structures/config');
const mongoose = require('mongoose');

module.exports = {
	name: 'ready',
	once: true,
	/**
 * 
 * @param {Client} client 
 * @returns
 */
	async execute(client) {
		const { user } = client;
		console.log(`${client.user.tag} is online!`);
		user.setActivity({ name: ' /get-help', type: ActivityType.Watching });

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