import { ActivityType, Client, Guild } from 'discord.js';
import { Event } from '../../Structures/Event';
import { startReactionCleanup } from '../../Utilities/reactionCleanup';

export default new Event<'clientReady'>('clientReady', async (client: Client) => {
	const { user, guilds } = client;
	console.log(`${user?.tag} is online`);
	const Enviroment = process.env.Enviroment;
	switch (Enviroment) {
		case 'dev':
			client.user?.setActivity({ name: 'Under Development', type: ActivityType.Streaming });
			break;
		case 'prod':
			client.user?.setActivity({ name: ` ${guilds.cache.size} Discord Severs`, type: ActivityType.Watching });
			guilds.cache.forEach((g: Guild) => console.log(g.name));
			break;
		case 'debug':
			client.user?.setActivity({ name: 'Debugging Code', type: ActivityType.Custom });
			break;
		default:
			console.log('Development Enviroment: ', Enviroment);
			break;
	}

	// start periodic cleanup job for stale reaction-role mappings
	try {
		// store stop function on client for shutdown flows
		// use an unknown-based narrow to avoid @typescript-eslint/no-explicit-any
		const stop = startReactionCleanup(client);
		(client as unknown as { __reactionCleanupStop?: (() => void) }).__reactionCleanupStop = stop;
	} catch (err) {
		console.error('Failed to start reaction cleanup', err);
	}
});