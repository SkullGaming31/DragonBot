import { Events } from 'discord.js';
import { ExtendedClient } from '../Structures/Client';
import { createApp } from './util/createApp';

export class Dashboard {
	client: ExtendedClient;
	constructor (client: ExtendedClient) {
		this.client = client;
	}
	init() {
		const initialize = () => {
			try {
				const app = createApp(this.client);
				app.listen(3001, () => {
					console.log('The Dashboard Has started');
				});
			} catch (error) {
				console.error(error);
			}
		};
		if (!this.client.isReady()) this.client.once(Events.ClientReady, () =>
			initialize());
		else initialize();
	}
}