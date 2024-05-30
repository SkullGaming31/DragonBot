import { ChannelType, ColorResolvable, EmbedBuilder, Presence, TextBasedChannel } from 'discord.js';
import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';

// Map to store the last presence update for each user
const lastPresenceMap: Map<string, Presence> = new Map();

export default new Event<'presenceUpdate'>('presenceUpdate', async (oldPresence: Presence | null, newPresence: Presence) => {
	// NOT CURRENTLY WORKING
	
	// try {
	// 	console.log('Old Presence', oldPresence?.activities[0]);
	// 	console.log('New Presence', newPresence?.activities[0]);

	// 	// Check if the presence update is for a member
	// 	if (!newPresence.member || !newPresence.guild) return;

	// 	// Fetch the log channel data
	// 	const data = await ChanLogger.findOne({ Guild: newPresence.guild.id });
	// 	if (!data || !data.enableLogs) return;

	// 	const logsChannelID = data.Channel;
	// 	if (!logsChannelID) return;

	// 	const logsChannelOBJ = newPresence.guild.channels.cache.get(logsChannelID) as TextBasedChannel | null;
	// 	if (!logsChannelOBJ || logsChannelOBJ.type !== ChannelType.GuildText) return;

	// 	// Get the last presence for this user
	// 	const lastPresence = lastPresenceMap.get(newPresence.member.id);

	// 	// Check if the user's status changed from "None" to a custom status or vice versa
	// 	const hasChangedFromNoneToCustom = (!lastPresence || lastPresence.activities[0]?.state === undefined) && newPresence.activities[0]?.state !== undefined;
	// 	const hasChangedFromCustomToNone = lastPresence?.activities[0]?.state !== undefined && newPresence.activities[0]?.state === undefined;

	// 	if (hasChangedFromNoneToCustom || hasChangedFromCustomToNone) {
	// 		// Update the last presence for this user
	// 		lastPresenceMap.set(newPresence.member.id, newPresence);

	// 		const Embed = new EmbedBuilder().setTitle(`${newPresence.guild.name}[empty]`).setTimestamp();

	// 		const newState = newPresence.activities[0]?.state || undefined;

	// 		// Set color based on presence status
	// 		let color;
	// 		switch (newPresence.status) {
	// 			case 'online':
	// 				color = 'Green';
	// 				break;
	// 			case 'offline':
	// 				color = 'Red';
	// 				break;
	// 			case 'dnd':
	// 			case 'idle':
	// 				color = 'Random';
	// 				break;
	// 			case 'invisible':
	// 				color = 'White';
	// 				break;
	// 			default:
	// 				color = 'Gold';
	// 				break;
	// 		}

	// 		// Send the presence update to the logs channel
	// 		await logsChannelOBJ.send({
	// 			embeds: [
	// 				Embed.setColor(color as ColorResolvable).setDescription(
	// 					`${newPresence.member.displayName} status has changed to: \`${newState}\` Status: ${newPresence.status}`
	// 				)
	// 			]
	// 		});
	// 	}
	// } catch (error) {
	// 	console.error('There was an issue with presence update Status: ', error);
	// }
});