import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";
import { Command } from "../../Structures/Command";

export default new Command({
	name: 'ping',
	description: 'Returns Pong',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'name',
			description: 'Tags you with the Bot Ping',
			type: ApplicationCommandOptionType.User,
			required: false
		}
	],
	run: async ({ interaction, client }) => {
		const { options } = interaction;
		const ping = client.ws.ping;
		const Pinger = options.getUser('name') || interaction.user.username;
		interaction.reply({ content: `${Pinger}, Bot Latency: ${ping}ms`, ephemeral: true });
	}
});