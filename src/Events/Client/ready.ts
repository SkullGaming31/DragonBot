import { ActivityType, Client } from 'discord.js';
import { Event } from '../../Structures/Event';

export default new Event<'ready'>('ready', async (client: Client) => {
	const { user } = client;
	console.log(`${user?.tag} is online`);
	client.user?.setActivity({ name: 'In Development', type: ActivityType.Custom });
});