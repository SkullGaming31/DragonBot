import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message, userMention } from 'discord.js';
import { Event } from '../../Structures/Event';

function createHelpEmbed(author: Message['author'], guildName?: string | undefined) {
	return new EmbedBuilder()
		.setColor('Green')
		.setDescription(`Hi ${author.username}, how can I help you out today? Leave a brief description of what your issue is, and someone will get to you as soon as they are free.`)
		.setThumbnail(`${author.displayAvatarURL({ size: 512 })}`)
		.setFooter({ text: guildName !== undefined ? guildName : '' });
}

function createButtonRow() {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL('https://github.com/SkullGaming31/skullgaming31')
			.setLabel('SkullGaming31\'s Github'),
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL('https://twitch.tv/canadiendragon')
			.setLabel('SkullGaming31\'s Twitch'),
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL('https://discord.com/api/oauth2/authorize?client_id=930882181595807774&permissions=30092622032118&redirect_uri=https%3A%2F%2Fdiscord.events.stdlib.com%2Fdiscord%2Fauth%2F&response_type=code&scope=bot%20applications.commands%20identify%20guilds%20messages.read')
			.setLabel('Invite Me')
	);
}

async function handleHelpMessage(message: Message) {
	const { author, guild, content } = message;
	const bot = guild?.members.cache.get('930882181595807774');

	if (!guild || author.bot) return;

	if (content.includes('@here') || content.includes('@everyone')) return;

	if (!content.includes(`${bot?.id}`)) return;

	const embed = createHelpEmbed(author, guild?.name);
	const row = createButtonRow();

	const msg = await message.reply({ content: userMention(author.id), embeds: [embed], components: [row] });
	await msg.startThread({ name: `${author.username} Support`, reason: 'support' });
}

export default new Event<'messageCreate'>('messageCreate', handleHelpMessage);