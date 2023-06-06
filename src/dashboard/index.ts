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
				const port = process.env.PORT;
				const app = createApp(this.client);
				app.listen(port, () => {
					console.log(`The Dashboard Has started, http://localhost:${port}`);
				});
			} catch (error) { console.error(error); }
		};
		if (!this.client.isReady()) this.client.once(Events.ClientReady, () => 
			initialize());
		else initialize();
	}
}