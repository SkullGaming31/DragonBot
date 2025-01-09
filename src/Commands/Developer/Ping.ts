import { ApplicationCommandType, MessageFlags } from 'discord.js';
import mongoose from 'mongoose';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'ping',
	nameLocalizations: {
		'en-US': 'ping',
	},
	description: 'Returns Bot Latency in MilliSeconds',
	descriptionLocalizations: {
		'en-US': 'Returns Bot Latency in MilliSeconds!'
	},
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,
	Category: 'Developer',

	run: async ({ interaction, client }) => {
		const ping = client.ws.ping;
		const uptime = process.uptime();
		if (uptime < 42) {
			await interaction.reply({ content: 'The bot has not been running for at least 42 seconds. Please wait for it to fully start before using this command.', flags: MessageFlags.Ephemeral });
			return; // Exit the command function
		}
		const uptimeHours = Math.floor(uptime / 3600);
		const uptimeMinutes = Math.floor((uptime % 3600) / 60);
		const uptimeSeconds = Math.floor(uptime % 60);

		// Measure MongoDB connection latency
		const start = Date.now();
		await mongoose.connection.db?.admin().ping();
		const mongoLatency = Date.now() - start;

		await interaction.reply({ content: `Bot Uptime: \`${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s\`\nBot Ping: \`${ping}ms\`\nMongoDB Latency: \`${mongoLatency}ms\`!`, flags: MessageFlags.Ephemeral });
	}
});
