import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";
import { Command } from "../../../src/Structures/Command";

export default new Command({
	name: 'ping',
	description: 'Returns Pong',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,

	run: async ({ interaction, client }) => {
		const ping = client.ws.ping;
		interaction.reply({ content: `Bot Latency: ${ping}ms`, ephemeral: true });
	}
});