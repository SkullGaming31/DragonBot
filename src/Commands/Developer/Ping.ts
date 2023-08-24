import { ApplicationCommandType } from 'discord.js';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'ping',
	nameLocalizations: {
		'en-US': 'ping'
	},
	description: 'Returns Bot Latency in MilliSeconds',
	descriptionLocalizations: {
		'en-US': 'Returns Bot Latency in MilliSeconds!!!!'
	},
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,

	run: async ({ interaction, client }) => {
		const ping2 = client.ws.ping;
		await interaction.reply({ content: `Bot Latency: ${ping2}ms`, ephemeral: true });
	}
});