import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message, userMention } from 'discord.js';
import { Event } from '../../Structures/Event';

// Define the bot IDs for development and production
const DEV_BOT_ID = '1147628312110305340';
const PROD_BOT_ID = '930882181595807774';

// Determine which bot ID to use based on the environment
const BOT_ID = process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug' ? DEV_BOT_ID : PROD_BOT_ID;

export default new Event<'messageCreate'>('messageCreate', async (message: Message) => {
	const { author, guild, content } = message;

	if (!guild) {
		console.log('No guild found.');
		return;
	}

	const bot = guild.members.cache.get(BOT_ID);
	// console.log('Bot:', bot);

	if (!bot) {
		console.log('Bot not found in the guild.');
		return;
	}

	if (process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug') {
		if (author.bot) {
			console.log('Message is from a bot.');
			return;
		}
	}

	if (content.includes('@here') || content.includes('@everyone')) {
		// console.log('Message contains @here or @everyone.');
		return;
	}

	if (!content.includes(`<@${BOT_ID}>`)) {
		// console.log('Message does not mention the bot.');
		return;
	}

	// console.log('Bot mentioned in message.');

	const embed = new EmbedBuilder()
		.setColor('Green')
		.setDescription(`Hi ${author.globalName || author.tag}, how can I help you out today? Leave a brief description of what your issue is, and someone will get to you as soon as they are free.`)
		.setThumbnail(`${author.displayAvatarURL({ size: 512 })}`)
		.setFooter({ text: guild.name });

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL('https://github.com/SkullGaming31/skullgaming31')
			.setLabel('SkullGaming31\'s Github'),
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL('https://discord.com/oauth2/authorize?client_id=930882181595807774')
			.setLabel('Add Me to your Discord Server'),
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL('https://twitch.tv/skullgaminghq')
			.setLabel('skullgaminghq\'s Twitch')
	);

	// console.log('Sending reply with embed and buttons...');
	const msg = await message.reply({ content: `${userMention(author.id)}, this message will delete in 5 minutes`, embeds: [embed], components: [row] });

	const timeoutDuration = process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug' ? 30000 : 300000;

	// console.log('Setting timeout for message deletion:', timeoutDuration);
	setTimeout(() => {
		if (msg.thread?.isThread()) {
			msg.thread.delete('time elapsed').catch((err) => { console.error('Couldn\'t delete the thread', err); });
		}
		msg.delete().catch((err) => { console.error('Error deleting message:', err); });
	}, timeoutDuration);
});