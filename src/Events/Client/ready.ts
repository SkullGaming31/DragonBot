import { ActivityType, Client } from 'discord.js';
import { Event } from '../../../src/Structures/Event';

export default new Event<'ready'>('ready', async (client: Client) => {
	console.log(`${client.user?.tag} is online`);
	client.user?.setActivity({ name: 'In Development', type: ActivityType.Listening });
});