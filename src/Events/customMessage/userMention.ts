import { Message, userMention } from 'discord.js';
import { Event } from '../../Structures/Event';
import { UserModel } from '../../Database/Schemas/userModel';
import { error as logError } from '../../Utilities/logger';

export default new Event<'messageCreate'>('messageCreate', async (message: Message) => {
	if (!message.inGuild()) return;
	const { guild, author } = message;

	if (author.bot) return;

	try {
		await UserModel.updateOne(
			{ guildID: guild.id, id: author.id, AFKmessage: { $type: 'string', $ne: '' } },
			{ $set: { AFKmessage: '', AFKstatus: null } }
		);
	} catch (error) {
		logError('Error clearing AFK message', { error: (error as Error)?.message ?? error, user: author.id, guild: guild.id });
	}

	if (!message.mentions.users.size) return;

	const mentionedUser = message.mentions.users.first();
	if (!mentionedUser) return;

	try {
		const userData = await UserModel.findOne({ guildID: guild.id, id: mentionedUser.id });
		if (!userData || !userData.AFKmessage) return;

		await message.reply({ content: `${userMention(author.id)}, **${mentionedUser.username}** is currently AFK: \`${userData.AFKmessage}\`` });
	} catch (error) {
		logError('Error handling AFK mention', { error: (error as Error)?.message ?? error });
	}
});