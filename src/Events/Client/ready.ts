import { ActivityType, Client } from 'discord.js';
import { Event } from '../../Structures/Event';

export default new Event<'ready'>('ready', async (client: Client) => {
	const { user, guilds } = client;
	console.log(`${user?.tag} is online`);
	setInterval(() => {
		if (process.env.Enviroment === 'dev') {
			// console.log('Development');
			client.user?.setActivity({ name: 'Under Development', type: ActivityType.Watching });
		} else if (process.env.Enviroment === 'prod') {
			// console.log('Production');
			client.user?.setActivity({ name: ` ${guilds.cache.size} Discord Severs`, type: ActivityType.Watching });
		} else {
			// console.log('Debug');
			client.user?.setActivity({ name: 'Debugging Code', type: ActivityType.Custom });
		}
	}, 30000);
});