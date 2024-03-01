import { ChannelType, EmbedBuilder, Presence, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';
import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';

export default new Event<'presenceUpdate'>('presenceUpdate', async (oldPresence: Presence | null, newPresence: Presence) => {
	try {
		const data = await ChanLogger.findOne({ Guild: newPresence.guild?.id }).catch((err: MongooseError) => { console.error(err.message); });
		// console.log('oldPresence: ', oldPresence);
		// console.log('newPresence: ', newPresence);

		if (!data || data.enableLogs === false) return;

		const logsChannelID = data?.Channel;
		if (logsChannelID === undefined) return;
		const logsChannelOBJ = newPresence.guild?.channels.cache.get(logsChannelID) as TextBasedChannel | null;
		if (!logsChannelOBJ) return;

		const Embed = new EmbedBuilder().setTitle(`${newPresence.guild?.name}[empty]`).setTimestamp();

		// Check if oldPresence is not null and if it has activities
		if (oldPresence && oldPresence.activities && oldPresence.activities.length > 0 && oldPresence.activities[0].type === 4) {
			// Access the old state only if oldPresence has activities
			const oldState = oldPresence.activities[0]?.state;
			const newState = newPresence.activities[0]?.state;
			const oldStatus = oldPresence.status;
			const newStatus = newPresence.status;

			// Check if newState is different from oldState
			if (newState && newState !== oldState) {
				if (logsChannelOBJ?.type === ChannelType.GuildText) {
					return logsChannelOBJ.send({
						embeds: [
							Embed.setDescription(`${newPresence.user?.globalName} status has changed from \`${oldState}\` to: \`${newState}\` \noldStatus: ${oldStatus} to: newStatus: ${newStatus}`)
						]
					});
				}
			}
		} else if (newPresence.activities && newPresence.activities.length > 0 && newPresence.activities[0].type === 4) {
			// Handle the case where oldPresence has no activities but newPresence does
			const newState = newPresence.activities[0]?.state;

			if (logsChannelOBJ?.type === ChannelType.GuildText && newState) {
				return logsChannelOBJ.send({
					embeds: [
						Embed.setDescription(`${newPresence.user?.globalName} set a custom status: \`${newState}\` \nStatus: ${newPresence.status}`)
					]
				});
			}
		}
	} catch (error) {
		console.error(error);
	}
});