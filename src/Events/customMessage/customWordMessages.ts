import { EmbedBuilder, Message, ChannelType } from 'discord.js';
import { Event } from '../../../src/Structures/Event';

function createHelpEmbed(authorTag: string, guildName?: string) {
	return new EmbedBuilder()
		.setAuthor({ name: authorTag })
		.setColor('Red')
		.setTitle('Testing message')
		.setDescription('this is a test message for the keyword of help!')
		.setTimestamp()
		.setFooter({ text: `${guildName ?? ''}` });
}

async function handleHelpMessage(message: Message) {
	if (message.content.includes('help') && message.content.endsWith('?')) {
		const { author, guild, channel } = message;
		const embed = createHelpEmbed(author.tag, guild?.name);
		if (channel.type === ChannelType.GuildText) {
			await message.reply({ embeds: [embed] });
		}
	}
}

export default new Event<'messageCreate'>('messageCreate', handleHelpMessage);