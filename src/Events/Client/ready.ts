import { ActivityType, Client } from "discord.js";
import { Event } from "../../Structures/Event";

export default new Event('ready', (client: Client) => {
	console.log(`${client.user?.tag} is online`);
	client.user?.setActivity({ name: ' /get-help', type: ActivityType.Watching });
});