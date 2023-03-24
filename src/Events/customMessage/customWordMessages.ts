import { EmbedBuilder, Colors, Message, ChannelType } from 'discord.js';
import { Event } from '../../../src/Structures/Event';

export default new Event('messageCreate', async (message: Message) => {
	if (message.content.includes('help') && message.content.endsWith('?')) { 
		const { author, guild, channel } = message;
		const embed = new EmbedBuilder()
			.setAuthor({ name: author.tag })
			.setColor('Red')
			.setTitle('Testing message')
			.setDescription('this is a test message for the keyword of help!')
			.setTimestamp()
			.setFooter({ text: `${guild?.name}` });

		if (channel.type === ChannelType.GuildText) await message.reply({ embeds: [embed] });
		console.log(message.content);
	}
});