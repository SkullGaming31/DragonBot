import { ApplicationCommandType, MessageFlags, TextDisplayBuilder } from 'discord.js';
import mongoose from 'mongoose';
import { Command } from '../../Structures/Command';

// console.log('[Ping] module loaded:', __filename);

// Constants
const MIN_UPTIME_SECONDS = 42;

export default new Command({
	name: 'ping',
	nameLocalizations: {
		'en-US': 'ping',
	},
	description: 'Returns Bot Latency in Milliseconds',
	descriptionLocalizations: {
		'en-US': 'Returns Bot Latency in Milliseconds!'
	},
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,
	Category: 'Developer',

	run: async ({ interaction, client }) => {
		// Check bot uptime
		const uptime = process.uptime();
		if (uptime < MIN_UPTIME_SECONDS) {
			return interaction.reply({
				content: 'The bot has not been running for at least 42 seconds. Please wait for it to fully start before using this command.',
				flags: MessageFlags.Ephemeral
			});
		}

		// Calculate bot statistics
		const ping = client.ws.ping;
		const { hours, minutes, seconds } = formatUptime(uptime);
		const mongoLatency = await measureMongoLatency();

		const builtContent = `Bot Uptime: \`${hours}h ${minutes}m ${seconds}s\`\n` + `Bot Ping: \`${ping}ms\`\n` + `MongoDB Latency: \`${mongoLatency}ms\`!!!`;
		const messageResponse = new TextDisplayBuilder().setContent(builtContent);

		// console.log('[Ping.run] built content:', builtContent);

		// Send response
		await interaction.reply({ flags: MessageFlags.IsComponentsV2, components: [messageResponse] });
		// console.log('[Ping.run] replied to interaction', interaction.id, 'with ping:', ping);
	}
});

/**
 * Formats uptime in seconds into hours, minutes, and seconds
 * @param uptime Uptime in seconds
 * @returns Object with formatted hours, minutes, and seconds
 */
function formatUptime(uptime: number): { hours: number; minutes: number; seconds: number } {
	const hours = Math.floor(uptime / 3600);
	const minutes = Math.floor((uptime % 3600) / 60);
	const seconds = Math.floor(uptime % 60);
	return { hours, minutes, seconds };
}

/**
 * Measures MongoDB connection latency
 * @returns MongoDB Latency in milliseconds
 */
async function measureMongoLatency(): Promise<number> {
	const start = Date.now();
	await mongoose.connection.db?.admin().ping();
	return Date.now() - start;
}