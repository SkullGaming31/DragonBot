import { ActivityType, Client, Guild } from 'discord.js';
import { Event } from '../../Structures/Event';
import { startReactionCleanup } from '../../Utilities/reactionCleanup';
import { startMetricsReporter } from '../../Utilities/metricsReporter';
import { startBirthdayScheduler } from '../../Utilities/birthdayScheduler';
import { info as logInfo, error as logError } from '../../Utilities/logger';

export default new Event<'clientReady'>('clientReady', async (client: Client) => {
	const { user, guilds } = client;
	logInfo(`${user?.tag} is online`);
	const Enviroment = process.env.Enviroment;
	switch (Enviroment) {
		case 'dev':
			client.user?.setActivity({ name: 'Under Development', type: ActivityType.Streaming });
			break;
		case 'prod':
			client.user?.setActivity({ name: ` ${guilds.cache.size} Discord Severs`, type: ActivityType.Watching });
			guilds.cache.forEach((g: Guild) => logInfo(`Guild: ${g.name}`));
			break;
		case 'debug':
			client.user?.setActivity({ name: 'Debugging Code', type: ActivityType.Custom });
			break;
		default:
			logInfo('Development Enviroment', { env: Enviroment });
			break;
	}

	// start periodic cleanup job for stale reaction-role mappings
	try {
		// store stop function on client for shutdown flows
		// use an unknown-based narrow to avoid @typescript-eslint/no-explicit-any
		const stop = startReactionCleanup(client);
		(client as unknown as { __reactionCleanupStop?: (() => void) }).__reactionCleanupStop = stop;
	} catch (err) {
		logError('Failed to start reaction cleanup', { error: (err as Error)?.message ?? err });
	}

	// start metrics reporter
	try {
		const stopMetrics = startMetricsReporter(client);
		(client as unknown as { __metricsStop?: (() => void) }).__metricsStop = stopMetrics;
	} catch (err) {
		logError('Failed to start metrics reporter', { error: (err as Error)?.message ?? err });
	}

	// start birthday scheduler
	try {
		const stopBirthday = startBirthdayScheduler(client);
		(client as unknown as { __birthdayStop?: (() => void) }).__birthdayStop = stopBirthday;
	} catch (err) {
		logError('Failed to start birthday scheduler', { error: (err as Error)?.message ?? err });
	}
});