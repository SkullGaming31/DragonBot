import { ChannelType, EmbedBuilder, Presence, TextBasedChannel } from 'discord.js';
import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';

// Map to store the last presence update timestamp for each user
const lastPresenceUpdateMap: Map<string, number> = new Map();

export default new Event<'presenceUpdate'>('presenceUpdate', async (oldPresence: Presence | null, newPresence: Presence) => {
	try {
		// Check if the presence update is for a member
		if (!newPresence.member || !newPresence.guild) return;

		// Fetch the log channel data
		const data = await ChanLogger.findOne({ Guild: newPresence.guild.id });
		if (!data || !data.enableLogs) return;

		const logsChannelID = data.Channel;
		if (!logsChannelID) return;

		const logsChannelOBJ = newPresence.guild.channels.cache.get(logsChannelID) as TextBasedChannel | null;
		if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

		// Check if a presence update was recently logged for this user
		const lastUpdateTimestamp = lastPresenceUpdateMap.get(newPresence.member.id) || 0;
		const currentTime = Date.now();
		const cooldown = 5 * 60 * 1000; // 5 minutes cooldown

		if (currentTime - lastUpdateTimestamp < cooldown) return;

		// Update the last presence update timestamp for this user
		lastPresenceUpdateMap.set(newPresence.member.id, currentTime);

		const Embed = new EmbedBuilder().setTitle(`${newPresence.guild.name}[empty]`).setTimestamp();

		// Check if the presence status or activity has changed
		if (oldPresence?.status !== newPresence.status || oldPresence?.activities[0]?.state !== newPresence.activities[0]?.state) {
			const oldState = oldPresence?.activities[0]?.state || 'None';
			const newState = newPresence.activities[0]?.state || 'None';

			// Send the presence update to the logs channel
			await logsChannelOBJ.send({
				embeds: [
					Embed.setDescription(`${newPresence.member.displayName} status has changed from \`${oldState}\` to: \`${newState}\`\nStatus: ${newPresence.status}`)
				]
			});
		}
	} catch (error) {
		console.error(error);
	}
});