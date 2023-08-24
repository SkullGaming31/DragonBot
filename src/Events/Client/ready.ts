import { ActivityType, Client } from 'discord.js';
import { Event } from '../../../src/Structures/Event';

export default new Event<'ready'>('ready', async (client: Client) => {
	const { user } = client;
	console.log(`${user?.username} is online`);
	client.user?.setActivity({ name: 'In Development', type: ActivityType.Listening });
});