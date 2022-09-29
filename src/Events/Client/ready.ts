import { ActivityType, Client } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
import mongoose from 'mongoose';

export default new Event('ready', async (client: Client) => {
	console.log(`${client.user?.tag} is online`);
	client.user?.setActivity({ name: ' /get-help', type: ActivityType.Watching });

	if (!process.env.MONGO_DATABASE_URI) return;
	await mongoose.connect(process.env.MONGO_DATABASE_URI, {
		connectTimeoutMS: 10000
	}).then(() => {
		console.log('Database Connected');
	}).catch((err: any) => {
		console.log(err);
	});
});