import { ActivityType, Client } from 'discord.js';
import { Event } from '../../Structures/Event';

export default new Event<'ready'>('ready', async (client: Client) => {
	const { user, guilds } = client;
	console.log(`Watching ${guilds.cache.size} Discord Severs`);
	console.log(`${user?.tag} is online`);
	setInterval(() => {
		client.user?.setActivity({ name: `Watching ${guilds.cache.size} Discord Severs`, type: ActivityType.Custom });
		if (process.env.Enviroment === 'dev') console.log('Updating');
	}, 300000);
});