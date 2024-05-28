import { Message, userMention } from 'discord.js';
import { Event } from '../../Structures/Event';
import { UserModel } from '../../Database/Schemas/userModel';

export default new Event<'messageCreate'>('messageCreate', async (message: Message) => {
	if (!message.inGuild()) return;
	const { guild, author } = message;

	// console.log('Message received:', message.content); // Log the received message

	if (message.author.bot || !message.mentions.users.size) return;

	const mentionedUser = message.mentions.users.first();
	if (!mentionedUser) return;

	// console.log('Mentioned user:', mentionedUser.username); // Log the mentioned user

	const userData = await UserModel.findOne({ guildID: guild?.id, id: mentionedUser.id });
	if (!userData || !userData.AFKmessage) return;

	// console.log('AFK message found:', userData.AFKmessage); // Log the AFK message

	try {
		await message.reply({ content: `${userMention(author.id)}, **${mentionedUser.username}** is currently AFK: \`${userData.AFKmessage}\`` });
	} catch (error) {
		console.error('Error replying to message:', error); // Log any errors that occur during message reply
	}
});