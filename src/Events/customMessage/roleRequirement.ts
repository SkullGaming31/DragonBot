import { ChannelType, Guild, TextChannel } from 'discord.js';
import SettingsModel from '../../Database/Schemas/settingsDB';
import { Event } from '../../Structures/Event';

export default new Event('guildCreate', async (guild: Guild) => {
	try {
		const { members } = guild;
		const settings = await SettingsModel.findOne({ GuildID: guild.id });
		const adminRole = settings?.AdministratorRole || ['Admin'];
		const modRole = settings?.ModeratorRole || ['Mod'];

		// Combine admin and mod roles into one array for checking
		const adminRoleNames = [...adminRole, ...modRole];

		// Check if either AdministratorRole or ModeratorRole is not defined in the database
		if (settings?.AdministratorRole === undefined || settings.ModeratorRole === undefined) return;

		// Check if the user has any of the administrator roles
		const isAdmin = members.cache.get(guild.client.user.id)?.roles.cache.some(role => adminRoleNames.includes(role.name));

		if (!isAdmin) {
			const modChannelId = '1022963329670586478';
			const ModerationChannel = guild.channels.cache.get(modChannelId) as TextChannel | null;
			if (ModerationChannel && ModerationChannel.type === ChannelType.GuildText) {
				await ModerationChannel.send({ content: 'The bot requires the roles "Admin" or "Mod" to function properly.' });
			}
		}
	} catch (error) {
		console.error(error);
	}
});